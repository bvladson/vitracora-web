import { createFileRoute } from "@tanstack/react-router";
import { BatteryCharging, PlugZap, Power } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero, SectionHeading } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { FAQSection } from "@/components/site/FAQSection";
import { CTASection } from "@/components/site/CTASection";
import { absoluteUrl } from "@/lib/site-config";

export const Route = createFileRoute("/energia")({
  head: () => ({
    meta: [
      { title: "Fontes, nobreaks e baterias em Fortaleza | VSB" },
      {
        name: "description",
        content:
          "Diagnóstico de fontes, nobreaks e baterias em Fortaleza e região metropolitana. Avaliação de alimentação e manutenção com Neto, da VSB.",
      },
      { property: "og:title", content: "Fontes, nobreaks e baterias em Fortaleza | VSB" },
      { property: "og:url", content: absoluteUrl("/energia") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/energia") }],
  }),
  component: Energia,
});

function Energia() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Energia · Fortaleza e região metropolitana"
        title={
          <>
            Fontes, nobreaks e baterias em <span className="text-primary">Fortaleza.</span>
          </>
        }
        subtitle="Avaliação técnica da alimentação e do comportamento dos equipamentos para entender a origem da falha. Atendimento com Neto em Fortaleza e região metropolitana."
      />

      <Section>
        <SectionHeading
          eyebrow="Da alimentação ao equipamento"
          title="Cada carga exige uma análise."
          subtitle="Tensão, corrente, conexões e condições de uso orientam o diagnóstico e a escolha dos componentes."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <ServiceCard
            icon={PlugZap}
            title="Fontes e carregadores"
            description="Medição, teste sob carga, dimensionamento e avaliação de reparo ou substituição de fontes para equipamentos eletrônicos."
            to="/fontes-eletronicos"
          />
          <ServiceCard
            icon={Power}
            title="Nobreaks"
            description="Avaliação da alimentação, das conexões e da bateria para identificar falhas e orientar a manutenção do conjunto."
          />
          <ServiceCard
            icon={BatteryCharging}
            title="Baterias"
            description="Diagnóstico de carga e verificação de compatibilidade, incluindo baterias, carregadores e BMS de bicicletas elétricas."
            to="/bicicletas-eletricas"
          />
        </div>
      </Section>

      <Section className="border-y border-border bg-card">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Método de trabalho
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl">Entender a causa para indicar a solução.</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Um equipamento que reinicia ou perde desempenho pode apresentar falha na alimentação,
              nas conexões ou na própria carga. A experiência prática de Neto em elétrica e
              eletrônica ajuda a avaliar essas partes em conjunto.
            </p>
          </div>
          <ol className="divide-y divide-border">
            {[
              {
                title: "Conhecer o sistema",
                description:
                  "Identificar o equipamento, as condições de uso e quando o sintoma aparece.",
              },
              {
                title: "Medir e verificar",
                description:
                  "Examinar alimentação, conexões e comportamento sob carga conforme o equipamento.",
              },
              {
                title: "Orientar a intervenção",
                description:
                  "Explicar o diagnóstico e avaliar a viabilidade de ajuste, reparo ou substituição.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                <span className="pt-1 text-sm font-semibold tabular-nums text-primary">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-lg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <FAQSection
        items={[
          {
            question: "Quais informações ajudam na avaliação?",
            answer:
              "Envie o modelo do equipamento, uma foto da etiqueta da fonte, nobreak ou bateria e descreva o sintoma. Isso ajuda a definir se a avaliação deve ocorrer em bancada ou no local.",
          },
          {
            question: "É possível instalar uma fonte de maior corrente?",
            answer:
              "A corrente disponível é apenas um dos critérios. Tensão, polaridade, conexão e características da carga também precisam ser compatíveis. A escolha depende da avaliação do conjunto.",
          },
          {
            question: "Toda falha de autonomia exige trocar a bateria?",
            answer:
              "Não necessariamente. Carregamento, conexões, consumo e estado da bateria precisam ser verificados antes de recomendar uma substituição.",
          },
        ]}
      />
      <CTASection
        title="Seu equipamento apresenta falhas de alimentação?"
        subtitle="Conte o que está acontecendo. Neto orienta o próximo passo para avaliar o sistema."
        service="fontes, nobreaks ou baterias"
        equipmentHint="Marca, modelo e dados da etiqueta da fonte, nobreak ou bateria, se disponíveis."
        buttonLabel="Avaliar falha de alimentação"
      />
    </SiteShell>
  );
}
