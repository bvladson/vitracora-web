import { createFileRoute } from "@tanstack/react-router";
import { CircuitBoard, Cpu, Zap, Activity, Layers, Gauge } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CTASection } from "@/components/site/CTASection";
import benchImg from "@/assets/bench-institutional.webp";
import { absoluteUrl } from "@/lib/site-config";
import { FAQSection } from "@/components/site/FAQSection";

export const Route = createFileRoute("/fontes-eletronicos")({
  head: () => ({
    meta: [
      { title: "Reparo de fontes e eletrônicos em Fortaleza | VSB" },
      {
        name: "description",
        content:
          "Diagnóstico e reparo de fontes e placas eletrônicas em Fortaleza e região metropolitana. Avaliação em bancada e atendimento com Neto, da VSB.",
      },
      { property: "og:title", content: "Reparos eletrônicos em Fortaleza | VSB" },
      { property: "og:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
      { property: "og:url", content: absoluteUrl("/fontes-eletronicos") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/fontes-eletronicos") }],
  }),
  component: Fontes,
});

function Fontes() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Eletrônica · Fortaleza e região metropolitana"
        title={
          <>
            Reparo de fontes e eletrônicos em <span className="text-primary">Fortaleza.</span>
          </>
        }
        subtitle="Diagnóstico, reparo e dimensionamento de fontes para câmeras, portões, fechaduras e outros equipamentos. Atendimento com Neto em Fortaleza e região metropolitana."
      />
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <figure className="relative">
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={benchImg}
                alt="Composição ilustrativa de bancada com instrumentos de medição e placa eletrônica"
                loading="lazy"
                width={1536}
                height={1024}
                className="w-full"
              />
            </div>
            <figcaption className="mt-3 text-xs text-muted-foreground">
              Bancada técnica · imagem ilustrativa
            </figcaption>
          </figure>
          <div>
            <h2 className="text-3xl sm:text-4xl">A fonte certa para cada equipamento.</h2>
            <p className="mt-5 text-muted-foreground">
              A alimentação é uma das partes avaliadas quando um equipamento falha. Verificamos
              tensão, corrente e perfil de carga para orientar o dimensionamento da fonte.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                "Fontes chaveadas",
                "Fontes anti-curto",
                "Fontes 12V e 24V",
                "Fontes para CFTV",
                "Fontes para fechaduras",
                "Fontes para controle de acesso",
                "Fontes colmeia",
                "Troca de capacitores",
                "Reparo em placas",
                "Diagnóstico de curto",
                "Teste de carga",
                "Proteção de alimentação",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                  <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border bg-secondary/40">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={CircuitBoard}
            title="Reparo de placas"
            description="Solda, troca de componentes e diagnóstico em placas eletrônicas."
            accent="cyan"
          />
          <ServiceCard
            icon={Zap}
            title="Diagnóstico de curto"
            description="Identificação de falhas em fontes, placas e sistemas alimentados."
            accent="amber"
          />
          <ServiceCard
            icon={Activity}
            title="Teste de carga"
            description="Verificação do comportamento da fonte sob carga para avaliar seu funcionamento."
          />
          <ServiceCard
            icon={Layers}
            title="Dimensionamento"
            description="Cálculo de amperagem e tensão por equipamento e distância de cabo."
            accent="cyan"
          />
          <ServiceCard
            icon={Gauge}
            title="Proteção elétrica"
            description="Avaliação de fusíveis, proteções e conexões da alimentação conforme o equipamento."
            accent="amber"
          />
          <ServiceCard
            icon={Cpu}
            title="Substituição completa"
            description="Troca de fontes obsoletas ou subdimensionadas por modelos adequados."
          />
        </div>
      </Section>
      <FAQSection
        items={[
          {
            question: "Como saber se a fonte está subdimensionada?",
            answer:
              "Queda de tensão, reinicializações e falhas ao aumentar a carga são indícios. A confirmação é feita com medição e teste sob carga.",
          },
          {
            question: "Toda placa eletrônica pode ser reparada?",
            answer:
              "Não. A viabilidade depende do dano, disponibilidade de componentes, segurança e custo em comparação com a substituição.",
          },
          {
            question: "Vocês testam antes de trocar?",
            answer:
              "Sim. O objetivo é identificar a causa e validar o comportamento sob carga antes de recomendar reparo ou substituição.",
          },
          {
            question: "É preciso levar o equipamento?",
            answer:
              "Alguns diagnósticos são feitos em bancada; outros exigem avaliação no local por envolver cabeamento, carga e instalação.",
          },
        ]}
      />
      <CTASection
        title="Seu equipamento parou ou funciona de forma irregular?"
        subtitle="Informe o sintoma para Neto e combine a avaliação. A viabilidade do reparo depende do diagnóstico e dos componentes disponíveis."
        service="reparo de fontes ou placas eletrônicas"
        equipmentHint="Marca e modelo do equipamento ou dados da etiqueta da fonte, se disponíveis."
        buttonLabel="Solicitar diagnóstico eletrônico"
      />
    </SiteShell>
  );
}
