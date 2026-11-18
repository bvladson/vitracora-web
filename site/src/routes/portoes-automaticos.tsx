import { createFileRoute } from "@tanstack/react-router";
import { DoorClosed, Settings2, RadioTower, Cog, Wrench, Zap } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CTASection } from "@/components/site/CTASection";
import gateImg from "@/assets/gate-night.webp";
import { absoluteUrl } from "@/lib/site-config";
import { FAQSection } from "@/components/site/FAQSection";

export const Route = createFileRoute("/portoes-automaticos")({
  head: () => ({
    meta: [
      { title: "Portões Automáticos — Instalação e Manutenção | VSB" },
      {
        name: "description",
        content:
          "Instalação, manutenção, troca de motor, central e ajuste de portões automáticos basculantes, deslizantes e pivotantes.",
      },
      { property: "og:title", content: "Portões Automáticos VSB" },
      { property: "og:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
      { property: "og:url", content: absoluteUrl("/portoes-automaticos") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/portoes-automaticos") }],
  }),
  component: Portoes,
});

function Portoes() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Portões automáticos"
        title={
          <>
            Portões que <span className="text-gradient-neon">funcionam todos os dias</span>, sem dor
            de cabeça.
          </>
        }
        subtitle="Instalação, manutenção e diagnóstico em portões basculantes, deslizantes e pivotantes."
      />
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-primary/30">
              <img
                src={gateImg}
                alt="Ilustração de portão automático e sua estrutura"
                loading="lazy"
                width={1600}
                height={1100}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl">Diagnóstico técnico antes do orçamento.</h2>
            <p className="mt-5 text-muted-foreground">
              A maioria dos problemas em portões vem da combinação errada entre motor, capacitor,
              central e cremalheira. Avaliamos tudo antes de propor a solução.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Troca e instalação de motor (deslizante, basculante, pivotante)",
                "Substituição de central e configuração de controles",
                "Fotocélula, fim de curso e cremalheira",
                "Capacitor e ajuste mecânico fino",
                "Destravamento manual e segurança",
                "Manutenção preventiva programada",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2 text-foreground/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section className="border-t border-border bg-secondary/40">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={DoorClosed}
            title="Instalação de motor"
            description="Motores deslizantes, basculantes e pivotantes com configuração completa."
          />
          <ServiceCard
            icon={Settings2}
            title="Troca de central"
            description="Substituição de placa de comando e programação de controles."
            accent="cyan"
          />
          <ServiceCard
            icon={RadioTower}
            title="Controles e fotocélula"
            description="Pareamento de controles, instalação de fotocélulas e sensores de segurança."
          />
          <ServiceCard
            icon={Cog}
            title="Cremalheira e fim de curso"
            description="Ajuste mecânico, regulagem de fim de curso e troca de cremalheira."
            accent="amber"
          />
          <ServiceCard
            icon={Zap}
            title="Capacitor e elétrica"
            description="Diagnóstico elétrico, troca de capacitor e proteção contra surtos."
            accent="amber"
          />
          <ServiceCard
            icon={Wrench}
            title="Manutenção preventiva"
            description="Lubrificação, ajustes e verificação completa para evitar falhas."
          />
        </div>
      </Section>
      <FAQSection
        items={[
          {
            question: "Todo problema exige troca do motor?",
            answer:
              "Não. Falhas podem estar na central, capacitor, fim de curso, cremalheira, controles ou parte mecânica. O diagnóstico evita trocas desnecessárias.",
          },
          {
            question: "Vocês configuram novos controles?",
            answer:
              "Sim. Avaliamos a central, compatibilidade e segurança antes de cadastrar ou substituir controles.",
          },
          {
            question: "É possível instalar fotocélula?",
            answer:
              "Sim. A fotocélula ajuda a reduzir o risco de fechamento quando há obstáculo e deve ser instalada e configurada corretamente.",
          },
          {
            question: "Quando fazer manutenção preventiva?",
            answer:
              "A frequência depende do uso e do ambiente. Portões de condomínios e empresas normalmente precisam de inspeções mais frequentes.",
          },
        ]}
      />
      <CTASection />
    </SiteShell>
  );
}
