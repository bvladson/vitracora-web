import { createServerFn } from "@tanstack/react-start";
import { catalogKind, type CatalogKind } from "./catalog-search";
import { categoryKind, catalogRoots } from "./catalog-taxonomy";

const CMS_URL = import.meta.env.VITE_CMS_URL || "https://cms.vsbseguranca.com.br";

const CACHE_TTL = 60_000;
// Teto do cache. Sem ele o Map crescia uma entrada por slug distinto de
// produto, post ou página e nunca liberava nada.
const CACHE_MAX_ENTRIES = 400;

export const PRODUCTS_PER_PAGE = 12;

type CacheEntry = { expires: number; value: unknown };

const responseCache = new Map<string, CacheEntry>();
// Deduplica requisições concorrentes para o mesmo caminho: sem isso, dez
// visitantes simultâneos em cache frio disparavam dez buscas ao WordPress.
const inFlight = new Map<string, Promise<unknown>>();

export type CmsImage = { url: string; alt?: string };

export type CmsContent = {
  id: number;
  slug: string;
  date: string;
  modified?: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_image?: CmsImage | null;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text?: string }>;
    "wp:term"?: Array<Array<{ name: string; slug: string }>>;
  };
};

export type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  description: string;
  short_description: string;
  sku: string;
  prices: {
    price: string;
    regular_price: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_prefix: string;
    currency_suffix: string;
  };
  images: Array<{ id: number; src: string; thumbnail: string; alt: string }>;
  categories: Array<{ id: number; name: string; slug: string }>;
};

export type ProductCategory = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
};

/**
 * O que o card do catálogo realmente usa. A resposta completa do WooCommerce
 * traz a descrição longa em HTML de cada produto: 57 KB por página de 12
 * contra 7 KB pedindo só estes campos.
 */
export type CatalogProductCard = Pick<
  CatalogProduct,
  "id" | "name" | "slug" | "sku" | "short_description" | "images" | "categories"
>;

const CARD_FIELDS = "id,name,slug,sku,short_description,images,categories";

export type ProductListResult = {
  products: CatalogProductCard[];
  total: number;
  totalPages: number;
  page: number;
};

/* ------------------------------------------------------------------ cache */

function cacheSet(path: string, value: unknown) {
  // delete + set recoloca a chave no fim da ordem de inserção do Map,
  // que é o que torna o descarte abaixo um LRU.
  responseCache.delete(path);
  responseCache.set(path, { expires: Date.now() + CACHE_TTL, value });

  while (responseCache.size > CACHE_MAX_ENTRIES) {
    const oldest = responseCache.keys().next();
    if (oldest.done) break;
    responseCache.delete(oldest.value);
  }
}

type CmsResponse<T> = { data: T; total: number; totalPages: number };

async function requestJson<T>(path: string): Promise<CmsResponse<T>> {
  const response = await fetch(`${CMS_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) throw new Error(`CMS respondeu ${response.status} em ${path}`);

  return {
    data: (await response.json()) as T,
    total: Number(response.headers.get("x-wp-total") ?? 0),
    totalPages: Number(response.headers.get("x-wp-totalpages") ?? 0),
  };
}

/**
 * Busca com stale-while-revalidate: uma entrada vencida é devolvida na hora e
 * revalidada em segundo plano. Antes, o primeiro visitante depois de cada
 * expiração pagava o custo inteiro da ida ao WordPress.
 */
function cmsFetch<T>(path: string): Promise<CmsResponse<T>> {
  const cached = responseCache.get(path);

  if (cached) {
    const isFresh = cached.expires > Date.now();

    if (!isFresh && !inFlight.has(path)) {
      const revalidation = requestJson<T>(path)
        .then((result) => {
          cacheSet(path, result);
          return result;
        })
        .catch((error) => {
          // Mantém a entrada vencida servindo enquanto o CMS não responde.
          console.error(`Revalidação do CMS falhou em ${path}:`, error);
          return cached.value as CmsResponse<T>;
        })
        .finally(() => inFlight.delete(path));

      inFlight.set(path, revalidation);
    }

    if (isFresh) {
      responseCache.delete(path);
      responseCache.set(path, cached);
    }
    return Promise.resolve(cached.value as CmsResponse<T>);
  }

  const pending = inFlight.get(path);
  if (pending) return pending as Promise<CmsResponse<T>>;

  const request = requestJson<T>(path)
    .then((result) => {
      cacheSet(path, result);
      return result;
    })
    .finally(() => inFlight.delete(path));

  inFlight.set(path, request);
  return request;
}

/* ----------------------------------------------------------- conteúdo WP */

type CmsCollection = "posts" | "pages" | "portfolio-cms" | "clientes-cms" | "servicos-cms";

async function fetchCmsCollection(collection: CmsCollection, limit = 100) {
  const { data } = await cmsFetch<CmsContent[]>(
    `/wp-json/wp/v2/${collection}?per_page=${limit}&_embed=1`,
  );
  return data;
}

async function fetchCmsItem(collection: Exclude<CmsCollection, "clientes-cms">, slug: string) {
  const { data } = await cmsFetch<CmsContent[]>(
    `/wp-json/wp/v2/${collection}?slug=${encodeURIComponent(slug)}&_embed=1`,
  );
  return data[0] ?? null;
}

/* -------------------------------------------------------------- catálogo */

async function fetchProductCategories(): Promise<ProductCategory[]> {
  const categories = new Map<number, ProductCategory>();
  // Pais sem produtos diretos também são necessários para montar a hierarquia.
  // A taxonomia já supera 100 termos: a raiz de serviços estava na página 2.
  for (let page = 1; ; page += 1) {
    const { data, totalPages } = await cmsFetch<ProductCategory[]>(
      `/wp-json/wc/store/v1/products/categories?per_page=100&page=${page}&hide_empty=false&_fields=id,name,slug,parent,count`,
    );
    data.forEach((category) => categories.set(category.id, category));
    if (page >= totalPages || data.length < 100) break;
  }
  return [...categories.values()];
}

/**
 * Uma página do catálogo. Busca e filtro acontecem no WooCommerce, não no
 * navegador: antes, os 324 produtos vinham inteiros para exibir 12.
 */
async function fetchProductPage(
  page: number,
  search: string,
  categorySlug: string,
  kind: CatalogKind = "all",
): Promise<ProductListResult> {
  const params = new URLSearchParams({
    per_page: String(PRODUCTS_PER_PAGE),
    page: String(Math.max(1, page)),
    orderby: "title",
    order: "asc",
    _fields: CARD_FIELDS,
  });

  if (search.trim()) params.set("search", search.trim());

  if ((categorySlug && categorySlug !== "all") || kind !== "all") {
    const categories = await fetchProductCategories();
    if (categorySlug && categorySlug !== "all") {
      const match = categories.find((category) => category.slug === categorySlug);
      // Filtros incompatíveis ou categoria desconhecida não podem ser ignorados.
      if (!match || (kind !== "all" && categoryKind(match, categories) !== kind)) {
        return { products: [], total: 0, totalPages: 0, page: 1 };
      }
      params.set("category", String(match.id));
    } else {
      const roots = catalogRoots(categories, kind);
      if (!roots.length) return { products: [], total: 0, totalPages: 0, page: 1 };
      params.set("category", roots.map((category) => category.id).join(","));
      params.set("category_operator", "in");
    }
  }

  const { data, total, totalPages } = await cmsFetch<CatalogProductCard[]>(
    `/wp-json/wc/store/v1/products?${params.toString()}`,
  );

  if (totalPages > 0 && page > totalPages) {
    return fetchProductPage(totalPages, search, categorySlug, kind);
  }
  return { products: data, total, totalPages, page: total === 0 ? 1 : Math.max(1, page) };
}

async function fetchProduct(slug: string): Promise<CatalogProduct | null> {
  const { data } = await cmsFetch<CatalogProduct[]>(
    `/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`,
  );
  return data[0] ?? null;
}

/**
 * Só os slugs, para o sitemap. Com `_fields` são ~4 KB por página de 100
 * em vez dos ~510 KB da resposta completa.
 */
async function fetchAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];

  for (let page = 1; page <= 20; page += 1) {
    const { data, totalPages } = await cmsFetch<Array<{ slug: string }>>(
      `/wp-json/wc/store/v1/products?per_page=100&page=${page}&_fields=slug`,
    );
    slugs.push(...data.map((item) => item.slug));
    if (page >= totalPages || data.length < 100) break;
  }

  return slugs;
}

/* -------------------------------------------------------- funções de rota */

export const getCmsCollection = createServerFn({ method: "GET" })
  .validator((data: { collection: CmsCollection; limit?: number }) => data)
  .handler(({ data }) => fetchCmsCollection(data.collection, data.limit));

export const getCmsItem = createServerFn({ method: "GET" })
  .validator((data: { collection: Exclude<CmsCollection, "clientes-cms">; slug: string }) => data)
  .handler(({ data }) => fetchCmsItem(data.collection, data.slug));

export const getProductPage = createServerFn({ method: "GET" })
  .validator(
    (data: { page?: number; search?: string; category?: string; kind?: CatalogKind }) => data,
  )
  .handler(({ data }) =>
    fetchProductPage(
      data.page ?? 1,
      data.search ?? "",
      data.category ?? "all",
      catalogKind(data.kind),
    ),
  );

export const getProductCategories = createServerFn({ method: "GET" }).handler(() =>
  fetchProductCategories(),
);

export const getProduct = createServerFn({ method: "GET" })
  .validator((data: { slug: string }) => data)
  .handler(({ data }) => fetchProduct(data.slug));

export const getAllProductSlugs = createServerFn({ method: "GET" }).handler(() =>
  fetchAllProductSlugs(),
);

/* ---------------------------------------------------------------- helpers */

export function contentImage(item: CmsContent) {
  return item.featured_image?.url ?? item._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
}

export function plainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8211;|&#8212;/g, "—")
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&quot;|&#8220;|&#8221;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
