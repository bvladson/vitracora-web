import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Boxes, Search, SlidersHorizontal, X } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, SectionEyebrow } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import {
  getProductCategories,
  getProductPage,
  plainText,
  PRODUCTS_PER_PAGE,
  type ProductCategory,
} from "@/lib/cms";
import { absoluteUrl, buildWhatsAppUrl } from "@/lib/site-config";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { trackWhatsAppClick } from "@/lib/analytics";
import { JsonLd } from "@/components/site/JsonLd";
import { breadcrumbSchema } from "@/lib/structured-data";
import { catalogKind, catalogPath, catalogSearch, type ProductSearch } from "@/lib/catalog-search";
import { categoryGroups, productCatalogInfo } from "@/lib/catalog-taxonomy";

export const Route = createFileRoute("/produtos")({
  // Busca, filtro e página vivem na URL: o resultado é compartilhável,
  // sobrevive ao botão voltar e é rastreável pelo Google.
  validateSearch: (search: Record<string, unknown>): ProductSearch =>
    catalogSearch({
      page: Math.max(1, Math.trunc(Number(search.page)) || 1),
      q: typeof search.q === "string" ? search.q.slice(0, 100) : "",
      cat: typeof search.cat === "string" ? search.cat : "all",
      tipo: catalogKind(search.tipo),
    }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    try {
      const [list, categories] = await Promise.all([
        getProductPage({
          data: {
            page: deps.page ?? 1,
            search: deps.q ?? "",
            category: deps.cat ?? "all",
            kind: deps.tipo ?? "all",
          },
        }),
        getProductCategories(),
      ]);
      return { ...list, categories, filters: deps, available: true };
    } catch (error) {
      console.error(error);
      return {
        products: [],
        total: 0,
        totalPages: 0,
        page: 1,
        categories: [] as ProductCategory[],
        filters: deps,
        available: false,
      };
    }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page ?? 1;
    const filters = loaderData?.filters ?? {};
    const suffix = page > 1 ? ` — Página ${page}` : "";
    const canonical = absoluteUrl(catalogPath({ ...filters, page }));

    const links: Array<{ rel: string; href: string }> = [{ rel: "canonical", href: canonical }];
    if (page > 1) {
      links.push({
        rel: "prev",
        href: absoluteUrl(catalogPath({ ...filters, page: page - 1 })),
      });
    }
    if (loaderData && page < loaderData.totalPages) {
      links.push({ rel: "next", href: absoluteUrl(catalogPath({ ...filters, page: page + 1 })) });
    }

    return {
      meta: [
        { title: `Equipamentos e Serviços${suffix} | Catálogo VSB` },
        {
          name: "description",
          content:
            "Encontre equipamentos e serviços técnicos da VSB em Fortaleza. Filtre por área, consulte aplicações e converse com Neto sobre seu projeto.",
        },
        // Páginas internas de paginação não precisam competir na busca.
        {
          name: "robots",
          content:
            page > 1 || filters.q || filters.cat || filters.tipo
              ? "noindex,follow"
              : "index,follow",
        },
        { property: "og:title", content: "Equipamentos e Serviços | Catálogo VSB" },
        { property: "og:url", content: canonical },
      ],
      links,
    };
  },
  component: ProductsPage,
});

function ProductsPage() {
  const data = Route.useLoaderData();
  const rawSearch = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const activeQuery = rawSearch.q ?? "";
  const activeCategory = rawSearch.cat ?? "all";
  const activeKind = rawSearch.tipo ?? "all";

  const [draft, setDraft] = useState(activeQuery);
  const isFirstRender = useRef(true);

  // A URL é a fonte da verdade: ao navegar pelo histórico, o campo acompanha.
  useEffect(() => {
    setDraft(activeQuery);
  }, [activeQuery]);

  // Debounce da digitação para não disparar uma navegação por tecla.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (draft === activeQuery) return;

    const timer = window.setTimeout(() => {
      navigate({
        search: catalogSearch({ q: draft, cat: activeCategory, tipo: activeKind }),
        replace: true,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft, activeQuery, activeCategory, activeKind, navigate]);

  const { products, total, totalPages, page, categories, available } = data;
  const hasFilters = Boolean(activeQuery) || activeCategory !== "all" || activeKind !== "all";
  const groups = categoryGroups(categories, activeKind);
  const firstOnPage = (page - 1) * PRODUCTS_PER_PAGE + 1;
  const lastOnPage = Math.min(page * PRODUCTS_PER_PAGE, total);

  return (
    <SiteShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Catálogo", path: "/produtos" },
        ])}
      />
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <SectionEyebrow>Catálogo VSB · Fortaleza e região</SectionEyebrow>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">
            Equipamentos e serviços técnicos.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Encontre o que seu projeto precisa. Consulte aplicação, compatibilidade e atendimento
            com Neto.
          </p>
        </div>
      </header>

      <Section className="!py-8 sm:!py-12">
        {!available ? (
          <CatalogUnavailable />
        ) : (
          <>
            <div className="mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Tipo de item">
                {(
                  [
                    ["all", "Todos"],
                    ["equipamentos", "Equipamentos"],
                    ["servicos", "Serviços"],
                  ] as const
                ).map(([kind, label]) => (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={activeKind === kind}
                    onClick={() => navigate({ search: catalogSearch({ q: draft, tipo: kind }) })}
                    className={`min-h-11 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                      activeKind === kind
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="relative block min-w-0">
                  <span className="sr-only">Buscar equipamento ou serviço</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    autoComplete="off"
                    placeholder="Buscar equipamento, serviço ou código..."
                    className="h-12 w-full rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>

                <label className="relative block min-w-0">
                  <span className="sr-only">Filtrar por categoria</span>
                  <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={activeCategory}
                    onChange={(event) =>
                      navigate({
                        search: catalogSearch({
                          q: draft,
                          cat: event.target.value,
                          tipo: activeKind,
                        }),
                      })
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="all">Todas as categorias</option>
                    {groups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((item) => (
                          <option key={item.slug} value={item.slug}>
                            {item.optionLabel}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span aria-live="polite">
                  {total === 0
                    ? "Nenhum item encontrado"
                    : `${firstOnPage}–${lastOnPage} de ${total} ${total === 1 ? "item" : "itens"}`}
                </span>
                {hasFilters && (
                  <Link
                    to="/produtos"
                    search={{}}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" /> Limpar filtros
                  </Link>
                )}
              </div>
            </div>

            {products.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product, index) => {
                  const image = product.images[0];
                  const info = productCatalogInfo(product, categories);
                  return (
                    <article
                      key={product.id}
                      className="card-tech group flex flex-col overflow-hidden p-0"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-secondary to-card">
                        {image ? (
                          <img
                            src={image.src}
                            alt={image.alt || product.name}
                            // As quatro primeiras imagens estão acima da dobra:
                            // carregar com lazy atrasaria o LCP do catálogo.
                            loading={index < 4 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            decoding="async"
                            width={640}
                            height={480}
                            className="h-full w-full bg-white/95 object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground">
                            <span className="grid h-20 w-20 place-items-center rounded-2xl border border-border bg-background/45">
                              <Boxes className="h-10 w-10" strokeWidth={1.25} />
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <span className="chip-tag self-start">{info.label}</span>
                        {info.categoryLabel && (
                          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            {info.categoryLabel}
                          </p>
                        )}
                        <h2 className="mt-4 text-lg font-bold leading-snug">{product.name}</h2>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {plainText(product.short_description) ||
                            (info.kind === "servicos"
                              ? "Consulte o escopo e o atendimento para seu projeto."
                              : "Consulte detalhes e aplicação deste equipamento.")}
                        </p>
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                          <Link
                            to="/produtos/$slug"
                            params={{ slug: product.slug }}
                            className="inline-flex min-h-11 flex-1 items-center gap-1.5 text-sm font-bold text-primary"
                          >
                            {info.kind === "servicos" ? "Ver serviço" : "Ver detalhes"}{" "}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                          <a
                            href={buildWhatsAppUrl(
                              `Olá Neto! Quero saber mais sobre ${product.name}.`,
                              `Card do produto: ${product.name}`,
                            )}
                            target="_blank"
                            rel="noreferrer noopener"
                            aria-label={`Consultar ${product.name} pelo WhatsApp`}
                            onClick={() => trackWhatsAppClick(`product_card:${product.slug}`)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <WhatsAppIcon className="h-5 w-5" /> Consultar
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-10 text-center">
                <Search className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-4 text-xl font-bold">Nenhum item encontrado</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {activeQuery
                    ? `Nada corresponde a "${activeQuery}" com estes filtros. Tente outro termo ou consulte Neto sobre seu projeto.`
                    : "Não há itens disponíveis nesta combinação de filtros. Consulte o catálogo completo ou fale com Neto."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/produtos" search={{}} className="btn-ghost-neon">
                    Ver todo o catálogo
                  </Link>
                  <a
                    href={buildWhatsAppUrl(
                      activeQuery
                        ? `Olá Neto! Procurei por "${activeQuery}" no site e não encontrei. Vocês trabalham com isso?`
                        : "Olá Neto! Preciso de ajuda para encontrar um equipamento ou serviço para meu projeto.",
                      "Busca sem resultado no catálogo",
                    )}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => trackWhatsAppClick("catalog_no_results")}
                    className="btn-neon"
                  >
                    <WhatsAppIcon className="h-5 w-5" /> Perguntar à equipe
                  </a>
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <nav
                className="mt-12 flex items-center justify-center gap-2 sm:gap-3"
                aria-label="Paginação do catálogo"
              >
                {page > 1 ? (
                  <Link
                    to="/produtos"
                    search={catalogSearch({
                      page: page - 1,
                      q: activeQuery,
                      cat: activeCategory,
                      tipo: activeKind,
                    })}
                    className="btn-ghost-neon min-h-11 !gap-1 !px-2.5 !text-xs sm:!gap-2 sm:!px-5 sm:!text-sm"
                    rel="prev"
                  >
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </Link>
                ) : (
                  <span
                    className="btn-ghost-neon min-h-11 cursor-not-allowed !gap-1 !px-2.5 !text-xs text-muted-foreground sm:!gap-2 sm:!px-5 sm:!text-sm"
                    aria-hidden="true"
                  >
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </span>
                )}

                <span className="min-w-16 text-center text-xs tabular-nums text-muted-foreground sm:min-w-24 sm:text-sm">
                  {page} de {totalPages}
                </span>

                {page < totalPages ? (
                  <Link
                    to="/produtos"
                    search={catalogSearch({
                      page: page + 1,
                      q: activeQuery,
                      cat: activeCategory,
                      tipo: activeKind,
                    })}
                    className="btn-ghost-neon min-h-11 !gap-1 !px-2.5 !text-xs sm:!gap-2 sm:!px-5 sm:!text-sm"
                    rel="next"
                  >
                    Próxima <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span
                    className="btn-ghost-neon min-h-11 cursor-not-allowed !gap-1 !px-2.5 !text-xs text-muted-foreground sm:!gap-2 sm:!px-5 sm:!text-sm"
                    aria-hidden="true"
                  >
                    Próxima <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </Section>
      <CTASection />
    </SiteShell>
  );
}

function CatalogUnavailable() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-8 text-center">
      <Boxes className="mx-auto h-12 w-12 text-primary" />
      <h2 className="mt-4 text-2xl font-bold">Catálogo temporariamente indisponível</h2>
      <p className="mt-2 text-muted-foreground">
        Não conseguimos carregar o catálogo agora, mas o atendimento continua normal.
      </p>
      <a
        href={buildWhatsAppUrl(
          "Olá Neto! Quero consultar os produtos disponíveis.",
          "Catálogo de produtos indisponível",
        )}
        target="_blank"
        rel="noreferrer noopener"
        onClick={() => trackWhatsAppClick("catalog_unavailable")}
        className="btn-neon mt-6"
      >
        <WhatsAppIcon className="h-5 w-5" /> Consultar pelo WhatsApp
      </a>
    </div>
  );
}
