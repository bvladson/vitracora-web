import { Section, SectionHeading } from "./Section";
import { JsonLd } from "@/components/site/JsonLd";
import { faqSchema } from "@/lib/structured-data";

export type FAQ = {
  question: string;
  answer: string;
};

export function FAQSection({ items }: { items: FAQ[] }) {
  return (
    <Section className="border-t border-border bg-secondary/40">
      {/* O conteúdo já existia; faltava declará-lo ao Google. Emitido aqui
          para que toda página que usa a seção ganhe o schema junto. */}
      <JsonLd data={faqSchema(items)} />
      <SectionHeading
        eyebrow="Dúvidas frequentes"
        title={
          <>
            Informação clara antes de <span className="text-gradient-neon">contratar</span>.
          </>
        }
      />
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <details key={item.question} className="card-tech group">
            <summary className="cursor-pointer list-none pr-8 text-base font-bold marker:hidden">
              {item.question}
              <span
                aria-hidden="true"
                className="absolute right-7 top-7 text-xl text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
