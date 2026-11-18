import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Camera,
  DoorClosed,
  Wrench,
  Fingerprint,
  Plug,
  Sparkles,
  AlarmClock,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero, SectionHeading } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CTASection } from "@/components/site/CTASection";
import condoImg from "@/assets/condo.webp";
import { absoluteUrl } from "@/lib/site-config";
import { FAQSection } from "@/components/site/FAQSection";

export const Route = createFileRoute("/condominios-empresas")({
  head: () => ({
    meta: [
      { title: "Condomínios e Empresas — Soluções Técnicas | VSB" },
      {
        name: "description",
        content:
          "Segurança eletrônica, manutenção preventiva, controle de acesso, CFTV, portões automáticos e infraestrutura para condomínios, empresas e galpões.",
      },
      { property: "og:title", content: "Condomínios e Empresas VSB" },
      { property: "og:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
      { property: "og:url", content: absoluteUrl("/condominios-empresas") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/condominios-empresas") }],
  }),
  component: Condos,
});

function Condos() {
  return (
    <SiteShell>
      <section className="relative isolate overflow-hidden border-b border-border">
        <img
          src={condoImg}
          alt="Condomínio com perímetro de segurança VSB"
          width={1600}
          height={1100}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/80 to-background/40" />
        <div className="mx-auto max-w-5xl px-4 py-28 text-center sm:px-6 lg:px-8">
          <span className="chip-tag">Soluções corporativas</span>
          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Soluções técnicas para{" "}
            <span className="text-gradient-neon">condomínios, empresas e galpões</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground sm:text-lg">
            Segurança eletrônica, manutenção preventiva, controle de acesso, CFTV, portões
            automáticos, elétrica e infraestrutura para ambientes que precisam funcionar todos os
            dias.
          </p>
        </div>
      </section>

      <Section>
        <SectionHeading
          eyebrow="O que oferecemos"
          title={
            <>
              Tudo o que um <span className="text-gradient-neon">ambiente coletivo</span> precisa.
            </>
          }
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ServiceCard
            icon={ShieldCheck}
            title="Segurança perimetral"
            description="Câmeras, cercas e sensores cobrindo todo o perímetro."
          />
          <ServiceCard
            icon={Camera}
            title="CFTV e monitoramento"
            description="Sistemas robustos com gravação confiável e acesso remoto."
          />
          <ServiceCard
            icon={DoorClosed}
            title="Portões e acessos"
            description="Portões sociais e de garagem com manutenção contínua."
            accent="amber"
          />
          <ServiceCard
            icon={Fingerprint}
            title="Controle de entrada"
            description="Biometria, tags e fechaduras para portarias e áreas restritas."
            accent="cyan"
          />
          <ServiceCard
            icon={Wrench}
            title="Contratos de manutenção"
            description="Visitas programadas para evitar falhas e prejuízos."
          />
          <ServiceCard
            icon={Plug}
            title="Elétrica preventiva"
            description="Inspeção em quadros, DPS, DR e infraestrutura crítica."
            accent="amber"
          />
          <ServiceCard
            icon={Sparkles}
            title="Organização técnica"
            description="Racks, cabeamento e identificação para facilitar manutenção."
            accent="cyan"
          />
          <ServiceCard
            icon={AlarmClock}
            title="Atendimento emergencial"
            description="Resposta rápida quando algo crítico parar de funcionar."
          />
        </div>
      </Section>
      <FAQSection
        items={[
          {
            question: "Vocês oferecem manutenção preventiva?",
            answer:
              "Sim. A proposta pode incluir visitas programadas, inspeção, testes e relatório dos pontos que precisam de correção.",
          },
          {
            question: "É possível atender sistemas já instalados?",
            answer:
              "Sim. Começamos com levantamento técnico para entender equipamentos, infraestrutura, falhas e prioridades.",
          },
          {
            question: "Como funciona o atendimento emergencial?",
            answer:
              "A disponibilidade e o prazo são definidos na proposta ou contrato conforme criticidade, localização e cobertura acordada.",
          },
          {
            question: "Vocês entregam proposta para aprovação?",
            answer:
              "Sim. Após o levantamento, organizamos escopo, prioridades e solução recomendada para facilitar a decisão.",
          },
        ]}
      />
      <CTASection
        title="Quer uma proposta para seu condomínio ou empresa?"
        subtitle="Fazemos visita técnica e apresentamos um plano de manutenção preventiva e corretiva."
      />
    </SiteShell>
  );
}
