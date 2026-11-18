import { createFileRoute } from "@tanstack/react-router";
import { Bike, BatteryCharging, Cpu, Gauge, Cable, Plug } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CTASection } from "@/components/site/CTASection";
import ebikeImg from "@/assets/ebike.webp";
import { absoluteUrl } from "@/lib/site-config";
import { FAQSection } from "@/components/site/FAQSection";

export const Route = createFileRoute("/bicicletas-eletricas")({
  head: () => ({
    meta: [
      { title: "Manutenção de Bicicletas Elétricas | VSB" },
      {
        name: "description",
        content:
          "Reparo elétrico em bicicletas elétricas: bateria, controladora, motor, BMS, display, carregador e chicote.",
      },
      { property: "og:title", content: "Bicicletas Elétricas VSB" },
      { property: "og:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
      { property: "og:url", content: absoluteUrl("/bicicletas-eletricas") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/bicicletas-eletricas") }],
  }),
  component: Bikes,
});

function Bikes() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Mobilidade elétrica"
        title={
          <>
            Manutenção elétrica para{" "}
            <span className="text-gradient-neon">bicicletas elétricas</span>.
          </>
        }
        subtitle="Diagnóstico e reparo em sistemas elétricos de bikes, incluindo bateria, carregador, controladora, motor, display e chicote."
      />
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border">
              <img
                src={ebikeImg}
                alt="Bicicleta elétrica em bancada"
                loading="lazy"
                width={1600}
                height={1100}
                className="w-full"
              />
            </div>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl">
              Sua bike parou? A gente identifica a causa real.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Trabalhamos com diagnóstico técnico em todos os componentes elétricos da bicicleta, da
              bateria ao display.
            </p>
          </div>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={BatteryCharging}
            title="Bateria e BMS"
            description="Diagnóstico de células, troca de bateria e reparo do BMS."
            accent="amber"
          />
          <ServiceCard
            icon={Plug}
            title="Carregador"
            description="Teste, reparo ou substituição de carregadores defeituosos."
          />
          <ServiceCard
            icon={Cpu}
            title="Controladora"
            description="Diagnóstico, troca e configuração de placa controladora."
            accent="cyan"
          />
          <ServiceCard
            icon={Bike}
            title="Motor hub"
            description="Manutenção e teste de motores de cubo dianteiro e traseiro."
          />
          <ServiceCard
            icon={Gauge}
            title="Display e acelerador"
            description="Substituição de display, manete e acelerador."
            accent="cyan"
          />
          <ServiceCard
            icon={Cable}
            title="Chicote elétrico"
            description="Reparo e refazimento do chicote, conectores e isolamento."
            accent="amber"
          />
        </div>
      </Section>
      <FAQSection
        items={[
          {
            question: "Bateria sem carga significa bateria danificada?",
            answer:
              "Nem sempre. Carregador, BMS, conectores e chicote também podem impedir a carga. O diagnóstico verifica o sistema completo.",
          },
          {
            question: "Vocês trabalham com qualquer modelo?",
            answer:
              "A compatibilidade e disponibilidade de peças variam. Envie fotos da bike, etiqueta da bateria e descrição do sintoma para uma pré-avaliação.",
          },
          {
            question: "É possível reparar o chicote elétrico?",
            answer:
              "Em muitos casos, sim. Avaliamos conectores, isolamento, continuidade e segurança antes de recomendar reparo ou substituição.",
          },
          {
            question: "Vocês fazem manutenção mecânica?",
            answer:
              "O foco da VSB é o sistema elétrico da bicicleta. Necessidades mecânicas podem exigir oficina especializada.",
          },
        ]}
      />
      <CTASection
        title="Bateria sem carga, display apagado ou motor sem força?"
        subtitle="Mande uma foto da bike pelo WhatsApp e fazemos uma pré-avaliação técnica."
      />
    </SiteShell>
  );
}
