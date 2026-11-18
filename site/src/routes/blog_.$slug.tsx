import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { CTASection } from "@/components/site/CTASection";
import { Section } from "@/components/site/Section";
import { blogCategory, findBlogPost, isPlaceholderPost } from "@/lib/blog-posts";
import { getCmsItem, plainText } from "@/lib/cms";
import { absoluteUrl } from "@/lib/site-config";

export const Route = createFileRoute("/blog_/$slug")({
  loader: async ({ params }) => {
    if (isPlaceholderPost(params.slug)) throw notFound();
    try {
      const cmsPost = await getCmsItem({ data: { collection: "posts", slug: params.slug } });
      if (cmsPost) {
        return {
          slug: cmsPost.slug,
          tag: blogCategory(cmsPost._embedded?.["wp:term"]?.[0]?.[0]?.name),
          title: plainText(cmsPost.title.rendered),
          date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
            new Date(cmsPost.date),
          ),
          isoDate: cmsPost.date,
          excerpt: plainText(cmsPost.excerpt.rendered),
          introduction: plainText(cmsPost.excerpt.rendered),
          html: cmsPost.content.rendered,
          service: findBlogPost(cmsPost.slug)?.service,
          sections: null,
        };
      }
    } catch (error) {
      console.error(error);
    }

    const localPost = findBlogPost(params.slug);
    if (!localPost) throw notFound();
    return { ...localPost, html: localPost.html ?? null };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | Blog VSB` },
          { name: "description", content: loaderData.excerpt },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.excerpt },
          { property: "og:type", content: "article" },
          { property: "og:url", content: absoluteUrl(`/blog/${loaderData.slug}`) },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: absoluteUrl(`/blog/${loaderData.slug}`) }] : [],
  }),
  component: BlogArticle,
});

function BlogArticle() {
  const post = Route.useLoaderData();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.isoDate,
    author: { "@type": "Organization", name: "VSB Soluções técnicas" },
    publisher: { "@type": "Organization", name: "VSB Soluções técnicas" },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };

  return (
    <SiteShell>
      <article>
        <header className="relative overflow-hidden border-b border-border tech-grid-bg">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao blog
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="chip-tag">{post.tag}</span>
              <time
                dateTime={post.isoDate}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Calendar className="h-4 w-4" /> {post.date}
              </time>
            </div>
            <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{post.title}</h1>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Por VSB Soluções técnicas
            </p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              {post.introduction}
            </p>
          </div>
        </header>
        <Section>
          <div className="mx-auto max-w-3xl space-y-12">
            {post.html ? (
              <div
                className="cms-content text-base text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: post.html }}
              />
            ) : (
              post.sections?.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl sm:text-3xl">{section.title}</h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  {section.items && (
                    <ul className="mt-5 space-y-3">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-foreground/90"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))
            )}
            <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Este conteúdo é informativo. Instalações elétricas, portões e sistemas de segurança
              devem ser avaliados por profissional qualificado antes de qualquer intervenção.
            </p>
          </div>
        </Section>
      </article>
      <CTASection
        service={post.service}
        title="Vamos avaliar o seu equipamento ou instalação."
        subtitle="Envie os sintomas, o modelo do equipamento e sua localização em Fortaleza ou região metropolitana. Neto conversa com você sobre a avaliação."
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </SiteShell>
  );
}
