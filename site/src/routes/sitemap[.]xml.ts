import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { absoluteUrl } from "@/lib/site-config";
import { BLOG_POSTS, isPlaceholderPost } from "@/lib/blog-posts";
import { getAllProductSlugs, getCmsCollection } from "@/lib/cms";

type ChangeFreq = "weekly" | "monthly" | "yearly";
type SitemapEntry = { path: string; priority: string; changefreq: ChangeFreq; lastmod?: string };

const STATIC_ROUTES: SitemapEntry[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/servicos", priority: "0.9", changefreq: "monthly" },
  { path: "/seguranca-eletronica", priority: "0.9", changefreq: "monthly" },
  { path: "/portoes-automaticos", priority: "0.9", changefreq: "monthly" },
  { path: "/condominios-empresas", priority: "0.9", changefreq: "monthly" },
  { path: "/produtos", priority: "0.9", changefreq: "weekly" },
  { path: "/eletrica", priority: "0.8", changefreq: "monthly" },
  { path: "/fontes-eletronicos", priority: "0.8", changefreq: "monthly" },
  { path: "/energia", priority: "0.8", changefreq: "monthly" },
  { path: "/telecomunicacoes", priority: "0.8", changefreq: "monthly" },
  { path: "/bicicletas-eletricas", priority: "0.8", changefreq: "monthly" },
  { path: "/contato", priority: "0.8", changefreq: "monthly" },
  { path: "/portfolio", priority: "0.7", changefreq: "monthly" },
  { path: "/blog", priority: "0.6", changefreq: "weekly" },
];

/**
 * Páginas que o WooCommerce cria sozinho e a página de exemplo do
 * WordPress. Não são conteúdo do site e não devem entrar no índice.
 */
const EXCLUDED_PAGE_SLUGS = new Set([
  "politica-de-privacidade",
  "termos-de-servico",
  "cart",
  "carrinho",
  "checkout",
  "finalizar-compra",
  "my-account",
  "minha-conta",
  "shop",
  "loja",
  "sample-page",
  "pagina-exemplo",
]);

/** Uma coleção do CMS que falhe não pode derrubar o sitemap inteiro. */
async function safely<T>(label: string, task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    console.error(`Sitemap: falha ao carregar ${label}:`, error);
    return fallback;
  }
}

async function collectEntries(): Promise<SitemapEntry[]> {
  const [products, posts, pages, services, portfolio] = await Promise.all([
    safely("produtos", () => getAllProductSlugs(), [] as string[]),
    safely("posts", () => getCmsCollection({ data: { collection: "posts" } }), []),
    safely("páginas", () => getCmsCollection({ data: { collection: "pages" } }), []),
    safely("serviços", () => getCmsCollection({ data: { collection: "servicos-cms" } }), []),
    safely("portfólio", () => getCmsCollection({ data: { collection: "portfolio-cms" } }), []),
  ]);

  const entries: SitemapEntry[] = [...STATIC_ROUTES];

  for (const slug of products) {
    entries.push({ path: `/produtos/${slug}`, priority: "0.7", changefreq: "monthly" });
  }

  for (const post of posts) {
    if (isPlaceholderPost(post.slug)) continue;
    entries.push({
      path: `/blog/${post.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: post.modified ?? post.date,
    });
  }

  for (const page of pages) {
    if (EXCLUDED_PAGE_SLUGS.has(page.slug)) continue;
    entries.push({
      path: `/pagina/${page.slug}`,
      priority: "0.5",
      changefreq: "monthly",
      lastmod: page.modified ?? page.date,
    });
  }

  for (const service of services) {
    entries.push({
      path: `/servicos/${service.slug}`,
      priority: "0.8",
      changefreq: "monthly",
      lastmod: service.modified ?? service.date,
    });
  }

  // O portfólio não tem rota própria por item; os projetos vivem na listagem.
  if (portfolio.length > 0) {
    const newest = portfolio
      .map((item) => item.modified ?? item.date)
      .sort()
      .at(-1);
    const listing = entries.find((entry) => entry.path === "/portfolio");
    if (listing && newest) listing.lastmod = newest;
  }

  // Se o CMS estiver fora, os posts locais garantem que o blog continue no índice.
  if (posts.length === 0) {
    for (const post of BLOG_POSTS) {
      entries.push({ path: `/blog/${post.slug}`, priority: "0.6", changefreq: "monthly" });
    }
  }

  // Um slug duplicado entre coleções geraria URLs repetidas no índice.
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.path)) return false;
    seen.add(entry.path);
    return true;
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries = await collectEntries();

        const urls = entries.map((entry) => {
          const lastmod = isoDate(entry.lastmod);
          return [
            "  <url>",
            `    <loc>${escapeXml(absoluteUrl(entry.path))}</loc>`,
            lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
            `    <changefreq>${entry.changefreq}</changefreq>`,
            `    <priority>${entry.priority}</priority>`,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n");
        });

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});
