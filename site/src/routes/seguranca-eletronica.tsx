import { createFileRoute } from "@tanstack/react-router";
import { Camera, Bell, Fingerprint, Zap, PhoneCall, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero, SectionHeading } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { CTASection } from "@/components/site/CTASection";
import { absoluteUrl } from "@/lib/site-config";
import { FAQSection } from "@/components/site/FAQSection";

export const Route = createFileRoute("/seguranca-eletronica")({
  head: () => ({
    meta: [
      { title: "Câmeras e segurança eletrônica em Fortaleza | VSB" },
      {
        name: "description",
        content:
          "Instalação e manutenção de câmeras, alarmes, controle de acesso e interfonia em Fortaleza e região metropolitana. Soluções técnicas com Neto, da VSB.",
      },
      { property: "og:title", content: "Segurança eletrônica em Fortaleza | VSB" },
      {
        property: "og:description",
        content:
          "Câmeras, alarmes, interfonia e controle de acesso em Fortaleza e região metropolitana. Instalação e manutenção com diagnóstico técnico.",
      },
      { property: "og:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
      { property: "og:url", content: absoluteUrl("/seguranca-eletronica") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/seguranca-eletronica") }],
  }),
  component: SegurancaEletronica,
});

function SegurancaEletronica() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Segurança eletrônica · Fortaleza e região metropolitana"
        title={
          <>
            Câmeras e segurança eletrônica em <span className="text-primary">Fortaleza.</span>
          </>
        }
        subtitle="Instalação e manutenção de câmeras, alarmes, cercas, controle de acesso e interfonia para residências, condomínios e empresas em Fortaleza e região metropolitana."
      />
      <Section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={Camera}
            title="CFTV e câmeras"
            description="Câmeras IP, analógicas, Wi-Fi, DVR e NVR com gravação configurada e infraestrutura limpa."
          />
          <ServiceCard
            icon={Bell}
            title="Alarmes e sensores"
            description="Sensores de presença, magnéticos, sirenes e centrais para alerta imediato."
            accent="amber"
          />
          <ServiceCard
            icon={Zap}
            title="Cerca elétrica"
            description="Cercas residenciais, condominiais e empresariais com manutenção e reforço."
            accent="amber"
          />
          <ServiceCard
            icon={Fingerprint}
            title="Controle de acesso"
            description="Biometria, senha, tag e fechaduras elétricas para portas e portarias."
            accent="cyan"
          />
          <ServiceCard
            icon={PhoneCall}
            title="Interfone e videoporteiro"
            description="Instalação e manutenção individual ou coletiva com diagnóstico técnico."
          />
          <ServiceCard
            icon={ShieldCheck}
            title="Infraestrutura"
            description="Cabeamento, rack, rede e organização técnica para todo o sistema."
            accent="cyan"
          />
        </div>
      </Section>

      <Section className="border-t border-border bg-secondary/40">
        <SectionHeading
          eyebrow="Como trabalhamos"
          title={
            <>
              Do diagnóstico à <span className="text-gradient-neon">entrega final</span>.
            </>
          }
        />
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: "01", t: "Visita técnica", d: "Avaliamos o ambiente e os pontos críticos." },
            { n: "02", t: "Projeto e orçamento", d: "Apresentamos a melhor solução com clareza." },
            { n: "03", t: "Instalação", d: "Cabeamento organizado e equipamentos configurados." },
            {
              n: "04",
              t: "Testes e orientação",
              d: "Verificamos o funcionamento e orientamos sobre uso e manutenção.",
            },
          ].map((s) => (
            <li key={s.n} className="card-tech">
              <span className="font-display text-3xl text-gradient-neon">{s.n}</span>
              <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </Section>
      <FAQSection
        items={[
          {
            question: "É possível acessar as câmeras pelo celular?",
            answer:
              "Sim. Quando o equipamento e a conexão permitem, configuramos acesso remoto e orientamos os responsáveis sobre o uso.",
          },
          {
            question: "Vocês aproveitam câmeras e cabeamento existentes?",
            answer:
              "Primeiro avaliamos compatibilidade, estado dos cabos, conectores e alimentação. O que estiver em boas condições pode ser aproveitado.",
          },
          {
            question: "Quanto tempo as imagens ficam gravadas?",
            answer:
              "Depende da quantidade de câmeras, resolução, modo de gravação e armazenamento. O período é dimensionado conforme a necessidade.",
          },
          {
            question: "A visita técnica é necessária?",
            answer:
              "Fotos ajudam na pré-avaliação, mas projetos com vários pontos ou infraestrutura nova normalmente exigem visita técnica.",
          },
        ]}
      />
      <CTASection
        title="Você precisa instalar ou revisar um sistema de segurança?"
        subtitle="Converse com Neto sobre o ambiente, os equipamentos existentes e o que precisa funcionar melhor."
        service="instalação ou manutenção de segurança eletrônica"
        equipmentHint="Tipo e modelo de câmera, alarme, interfone ou controle de acesso, se houver."
        buttonLabel="Avaliar meu sistema de segurança"
      />
    </SiteShell>
  );
}
