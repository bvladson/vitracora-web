import { createFileRoute } from "@tanstack/react-router";
import { Plug, Lightbulb, ShieldCheck, Zap, Cable, Activity } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CTASection } from "@/components/site/CTASection";
import { absoluteUrl } from "@/lib/site-config";
import { FAQSection } from "@/components/site/FAQSection";

export const Route = createFileRoute("/eletrica")({
  head: () => ({
    meta: [
      { title: "Elétrica residencial e comercial em Fortaleza | VSB" },
      {
        name: "description",
        content:
          "Instalação e manutenção elétrica em Fortaleza e região metropolitana. Revisão de quadros, circuitos e proteção, com atendimento direto com Neto.",
      },
      { property: "og:title", content: "Elétrica em Fortaleza | VSB" },
      { property: "og:url", content: absoluteUrl("/eletrica") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/eletrica") }],
  }),
  component: Eletrica,
});

function Eletrica() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Elétrica · Fortaleza e região metropolitana"
        title={
          <>
            Elétrica em Fortaleza com <span className="text-primary">técnica e organização</span>.
          </>
        }
        subtitle="Instalação e manutenção de quadros, circuitos, proteção e infraestrutura para casas, comércios e empresas. Atendimento com Neto em Fortaleza e região metropolitana."
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={Plug}
            title="Instalação elétrica"
            description="Residencial e comercial, com circuitos dimensionados e identificados."
            accent="amber"
          />
          <ServiceCard
            icon={ShieldCheck}
            title="Quadro elétrico"
            description="Revisão, organização, disjuntores, DR e DPS conforme norma."
          />
          <ServiceCard
            icon={Zap}
            title="Aterramento"
            description="Instalação e medição de aterramento para segurança e equipamentos sensíveis."
            accent="amber"
          />
          <ServiceCard
            icon={Lightbulb}
            title="Iluminação externa"
            description="Sensores de presença, refletores LED e iluminação automatizada."
          />
          <ServiceCard
            icon={Cable}
            title="Infraestrutura técnica"
            description="Eletrodutos, caixas e cabeamento para CFTV, portões e rede."
            accent="cyan"
          />
          <ServiceCard
            icon={Activity}
            title="Manutenção preventiva"
            description="Inspeção visual, verificação de conexões e identificação de sinais de aquecimento ou desgaste."
          />
        </div>
      </Section>
      <FAQSection
        items={[
          {
            question: "Qual a diferença entre DR e DPS?",
            answer:
              "O DR atua principalmente contra fugas de corrente e risco de choque. O DPS ajuda a proteger a instalação contra surtos de tensão.",
          },
          {
            question: "Vocês revisam quadros elétricos existentes?",
            answer:
              "Sim. Avaliamos organização, conexões, proteções, identificação e sinais visíveis de aquecimento ou desgaste.",
          },
          {
            question: "É possível criar circuito dedicado?",
            answer:
              "Sim, após avaliar carga, infraestrutura, quadro e proteções necessárias para o equipamento.",
          },
          {
            question: "Vocês atendem empresas e condomínios?",
            answer:
              "Sim. Também montamos propostas de inspeção e manutenção preventiva para ambientes coletivos.",
          },
        ]}
      />
      <CTASection
        title="O que precisa de atenção na sua instalação elétrica?"
        subtitle="Descreva a necessidade para Neto. A avaliação considera o circuito, o equipamento e as condições da instalação."
        service="instalação ou manutenção elétrica"
        equipmentHint="Equipamento e modelo, circuito ou parte da instalação que precisa de atendimento."
        buttonLabel="Solicitar avaliação elétrica"
      />
    </SiteShell>
  );
}
