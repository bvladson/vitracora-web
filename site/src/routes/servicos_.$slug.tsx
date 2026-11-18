import { createFileRoute, notFound } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHero, Section } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { contentImage, getCmsItem, plainText } from "@/lib/cms";
import { absoluteUrl, buildWhatsAppUrl } from "@/lib/site-config";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

export const Route = createFileRoute("/servicos_/$slug")({
  loader: async ({ params }) => {
    try {
      const service = await getCmsItem({
        data: { collection: "servicos-cms", slug: params.slug },
      });
      if (service) return service;
    } catch (error) {
      console.error(error);
    }
    throw notFound();
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${plainText(loaderData.title.rendered)} | Serviços VSB` },
          { name: "description", content: plainText(loaderData.excerpt.rendered) },
        ]
      : [],
    links: loaderData
      ? [{ rel: "canonical", href: absoluteUrl(`/servicos/${loaderData.slug}`) }]
      : [],
  }),
  component: CmsServicePage,
});

function CmsServicePage() {
  const service = Route.useLoaderData();
  const title = plainText(service.title.rendered);
  const image = contentImage(service);
  return (
    <SiteShell>
      <PageHero
        eyebrow="Serviço VSB"
        title={title}
        subtitle={plainText(service.excerpt.rendered)}
      />
      <Section>
        <div className="mx-auto max-w-5xl">
          {image && (
            <img
              src={image}
              alt={service.featured_image?.alt || title}
              width={1200}
              height={700}
              className="mb-10 max-h-[34rem] w-full rounded-2xl border border-border object-cover"
            />
          )}
          <article
            className="cms-content text-base text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: service.content.rendered }}
          />
          <a
            href={buildWhatsAppUrl(
              `Olá Neto! Quero solicitar um orçamento para: ${title}.`,
              `Página do serviço: ${title}`,
            )}
            target="_blank"
            rel="noreferrer"
            className="btn-neon mt-10"
          >
            <WhatsAppIcon className="h-5 w-5" /> Solicitar orçamento
          </a>
        </div>
      </Section>
      <CTASection />
    </SiteShell>
  );
}
