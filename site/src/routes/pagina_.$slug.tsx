import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero, Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { getCmsItem, plainText } from "@/lib/cms";
import { absoluteUrl } from "@/lib/site-config";

// Páginas que o WooCommerce cria sozinho (carrinho, checkout, minha conta,
// loja) e a página de exemplo do WordPress. Não são conteúdo institucional:
// renderizá-las dentro do site produziria uma página quebrada, e indexá-las
// desperdiçaria orçamento de rastreamento. Mesma lista usada no sitemap.
const SYSTEM_PAGE_SLUGS = new Set([
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

export const Route = createFileRoute("/pagina_/$slug")({
  beforeLoad: ({ params }) => {
    if (["politica-de-privacidade", "termos-de-servico"].includes(params.slug)) {
      throw redirect({ href: `https://cms.vsbseguranca.com.br/${params.slug}/`, statusCode: 301 });
    }
  },
  loader: async ({ params }) => {
    if (SYSTEM_PAGE_SLUGS.has(params.slug)) throw notFound();
    try {
      const page = await getCmsItem({ data: { collection: "pages", slug: params.slug } });
      if (page) return page;
    } catch (error) {
      console.error(error);
    }
    throw notFound();
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${plainText(loaderData.title.rendered)} | VSB Soluções técnicas` },
          { name: "description", content: plainText(loaderData.excerpt.rendered) },
        ]
      : [],
    links: loaderData
      ? [{ rel: "canonical", href: absoluteUrl(`/pagina/${loaderData.slug}`) }]
      : [],
  }),
  component: InstitutionalPage,
});

function InstitutionalPage() {
  const page = Route.useLoaderData();
  return (
    <SiteShell>
      <PageHero
        eyebrow="VSB Soluções técnicas"
        title={plainText(page.title.rendered)}
        subtitle={plainText(page.excerpt.rendered)}
      />
      <Section>
        <article
          className="cms-content mx-auto max-w-4xl text-base text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: page.content.rendered }}
        />
      </Section>
      <CTASection />
    </SiteShell>
  );
}
