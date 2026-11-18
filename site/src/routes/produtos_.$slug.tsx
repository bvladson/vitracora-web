import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight, PackageSearch } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section } from "@/components/site/Section";
import { getProduct, getProductCategories, plainText } from "@/lib/cms";
import { absoluteUrl, buildWhatsAppUrl } from "@/lib/site-config";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { trackWhatsAppClick } from "@/lib/analytics";
import { JsonLd } from "@/components/site/JsonLd";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";
import { productCatalogInfo } from "@/lib/catalog-taxonomy";
import { catalogSearch } from "@/lib/catalog-search";

export const Route = createFileRoute("/produtos_/$slug")({
  loader: async ({ params }) => {
    try {
      const [product, categories] = await Promise.all([
        getProduct({ data: { slug: params.slug } }),
        getProductCategories(),
      ]);
      if (!product) throw notFound();
      return { product, info: productCatalogInfo(product, categories) };
    } catch (error) {
      if (error && typeof error === "object" && "isNotFound" in error) throw error;
      console.error(error);
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.product.name} | VSB Soluções técnicas` : "Catálogo | VSB",
      },
      {
        name: "description",
        content: loaderData
          ? `Consulte ${loaderData.product.name} com a VSB em Fortaleza. ${loaderData.info.kind === "servicos" ? "Conheça o escopo e solicite avaliação técnica para seu projeto." : "Confirme aplicação, compatibilidade e disponibilidade com Neto."}`
          : "Consulte produtos e aplicações com a equipe VSB.",
      },
      {
        property: "og:type",
        content: loaderData?.info.kind === "servicos" ? "website" : "product",
      },
      { property: "og:title", content: loaderData?.product.name },
      { property: "og:image", content: loaderData?.product.images[0]?.src },
    ],
    links: loaderData
      ? [{ rel: "canonical", href: absoluteUrl(`/produtos/${loaderData.product.slug}`) }]
      : [],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { product, info } = Route.useLoaderData();
  const isService = info.kind === "servicos";
  const image = product.images[0];
  const quoteUrl = buildWhatsAppUrl(
    `Olá Neto! Quero informações e orçamento sobre ${product.name}.`,
    `Página do produto: ${product.name}`,
  );

  return (
    <SiteShell>
      <JsonLd
        data={
          isService
            ? {
                "@context": "https://schema.org",
                "@type": "Service",
                name: product.name,
                description: plainText(product.short_description || product.description),
                url: absoluteUrl(`/produtos/${product.slug}`),
                provider: {
                  "@type": "Organization",
                  name: "VSB Soluções técnicas",
                  url: absoluteUrl("/"),
                },
                ...(product.images.length ? { image: product.images.map((item) => item.src) } : {}),
              }
            : productSchema(product)
        }
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Catálogo", path: "/produtos" },
          { name: product.name, path: `/produtos/${product.slug}` },
        ])}
      />
      <Section className="pt-12 sm:pt-16">
        <nav
          aria-label="Trilha de navegação"
          className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
          <Link to="/produtos" search={{}} className="hover:text-primary">
            Catálogo
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
          <span className="text-foreground/70">{product.name}</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {image ? (
              <img
                src={image.src}
                alt={image.alt || product.name}
                width={900}
                height={900}
                fetchPriority="high"
                decoding="async"
                className="aspect-square h-full w-full bg-white/95 object-contain p-6"
              />
            ) : (
              <div className="grid aspect-square place-items-center text-muted-foreground">
                <PackageSearch className="h-20 w-20" strokeWidth={1} />
              </div>
            )}
          </div>
          <div>
            <span className="chip-tag">{info.label}</span>
            {info.category && (
              <Link
                to="/produtos"
                search={catalogSearch({ tipo: info.kind, cat: info.category.slug })}
                className="mt-3 block text-sm leading-relaxed text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                {info.categoryLabel}
              </Link>
            )}
            <h1 className="mt-5 text-3xl leading-tight sm:text-4xl lg:text-5xl">{product.name}</h1>
            {product.sku && (
              <p className="mt-2 text-xs text-muted-foreground">Código: {product.sku}</p>
            )}
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-primary">
              {isService ? "Sobre o serviço" : "Aplicação do equipamento"}
            </p>
            <div
              className="cms-content mt-6 text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html:
                  product.short_description ||
                  (isService
                    ? "Converse com Neto para definir o escopo, avaliar as condições do local e solicitar um orçamento."
                    : "Consulte nossa equipe para confirmar especificações, compatibilidade e disponibilidade."),
              }}
            />
            <a
              href={quoteUrl}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackWhatsAppClick(`product_page:${product.slug}`)}
              className="btn-neon mt-8"
            >
              <WhatsAppIcon className="h-5 w-5" />{" "}
              {isService ? "Solicitar avaliação" : "Consultar aplicação"}
            </a>
            <ul className="mt-8 grid gap-3 text-sm text-foreground/90">
              {(isService
                ? [
                    "Avaliação das necessidades do projeto",
                    "Escopo e condições definidos no orçamento",
                    "Atendimento em Fortaleza e região",
                  ]
                : [
                    "Orientação técnica antes da compra",
                    "Confirmação de compatibilidade",
                    "Opção de instalação pela equipe VSB",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        {product.description && (
          <article className="mt-16 border-t border-border pt-10">
            <h2 className="text-2xl font-bold">
              {isService ? "Escopo e atendimento" : "Aplicações e especificações"}
            </h2>
            <div
              className="cms-content mt-5 max-w-4xl text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </article>
        )}
      </Section>
    </SiteShell>
  );
}
