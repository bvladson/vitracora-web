import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { ArrowRight, Calendar } from "lucide-react";
import { absoluteUrl } from "@/lib/site-config";
import { BLOG_POSTS, blogCategory, isPlaceholderPost } from "@/lib/blog-posts";
import { getCmsCollection, plainText } from "@/lib/cms";

/** Forma única entregue à view, venha o post do CMS ou do arquivo local. */
type BlogCard = {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  isoDate: string;
  date: string;
};

const formatDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(parsed);
};

export const Route = createFileRoute("/blog")({
  // A normalização acontece aqui, não na view: antes o componente recebia
  // uma união de dois formatos e tentava distinguí-los em tempo de render,
  // o que o TypeScript não conseguia acompanhar.
  loader: async (): Promise<{ posts: BlogCard[] }> => {
    try {
      const posts = (await getCmsCollection({ data: { collection: "posts" } })).filter(
        (post) => !isPlaceholderPost(post.slug),
      );
      if (posts.length > 0) {
        return {
          posts: posts.map((post) => ({
            slug: post.slug,
            tag: blogCategory(post._embedded?.["wp:term"]?.[0]?.[0]?.name),
            title: plainText(post.title.rendered),
            excerpt: plainText(post.excerpt.rendered),
            isoDate: post.date,
            date: formatDate(post.date),
          })),
        };
      }
    } catch (error) {
      console.error(error);
    }

    return {
      posts: BLOG_POSTS.map((post) => ({
        slug: post.slug,
        tag: post.tag,
        title: post.title,
        excerpt: post.excerpt,
        isoDate: post.isoDate,
        date: post.date,
      })),
    };
  },
  head: () => ({
    meta: [
      { title: "Blog VSB | Elétrica, eletrônica, energia e telecomunicações" },
      {
        name: "description",
        content:
          "Conteúdo técnico da VSB sobre elétrica, eletrônica, energia, telecomunicações e segurança eletrônica. Orientações para entender falhas e planejar o atendimento em Fortaleza e região.",
      },
      { property: "og:title", content: "Blog VSB | Conteúdo técnico" },
      {
        property: "og:description",
        content:
          "Orientações sobre diagnóstico, equipamentos e instalações nas cinco áreas técnicas da VSB.",
      },
      { property: "og:url", content: absoluteUrl("/blog") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/blog") }],
  }),
  component: Blog,
});

function Blog() {
  const data = Route.useLoaderData();
  return (
    <SiteShell>
      <PageHero
        eyebrow="Blog e dicas"
        title={
          <>
            Conteúdo técnico para <span className="text-gradient-neon">decisões melhores</span>.
          </>
        }
        subtitle="Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica: orientações para entender os sintomas e planejar a solução."
      />
      <Section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.posts.map((p) => {
            return (
              <article key={p.slug} className="card-tech group">
                <span className="chip-tag">{p.tag}</span>
                <h2 className="mt-4 text-lg font-bold leading-snug">{p.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
                  <time dateTime={p.isoDate} className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> {p.date}
                  </time>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: p.slug }}
                    className="inline-flex items-center gap-1 font-semibold text-primary"
                  >
                    Ler artigo <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </Section>
      <CTASection />
    </SiteShell>
  );
}
