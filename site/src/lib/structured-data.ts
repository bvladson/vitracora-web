import { absoluteUrl, COMPANY } from "@/lib/site-config";
import { plainText, type CatalogProduct } from "@/lib/cms";

/**
 * Dados estruturados. O site já publicava LocalBusiness na raiz; faltavam
 * justamente os tipos que o Google converte em resultado enriquecido —
 * migalhas, produtos e perguntas frequentes.
 */

export function breadcrumbSchema(trail: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(entries: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

export function productSchema(product: CatalogProduct) {
  const description =
    plainText(product.short_description || product.description) ||
    `${product.name} — consulte aplicação e disponibilidade com a equipe VSB.`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description,
    url: absoluteUrl(`/produtos/${product.slug}`),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.images.length > 0 ? { image: product.images.map((image) => image.src) } : {}),
    ...(product.categories[0] ? { category: product.categories[0].name } : {}),
    // Sem preço público: o catálogo é de consulta, então o schema declara
    // disponibilidade para contato em vez de inventar um valor.
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  published?: string;
  modified?: string;
  image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    ...(input.published ? { datePublished: input.published } : {}),
    ...(input.modified ? { dateModified: input.modified } : {}),
    ...(input.image ? { image: input.image } : {}),
    author: { "@type": "Organization", name: COMPANY.name, url: absoluteUrl("/") },
    publisher: {
      "@type": "Organization",
      name: COMPANY.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo-principal-oficial-20260911.png") },
    },
  };
}
