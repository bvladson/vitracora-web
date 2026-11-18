import { createFileRoute } from "@tanstack/react-router";
import { Cable, Network, Activity } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero, SectionHeading } from "@/components/site/Section";
import { ServiceCard } from "@/components/site/ServiceCard";
import { FAQSection } from "@/components/site/FAQSection";
import { CTASection } from "@/components/site/CTASection";
import { absoluteUrl } from "@/lib/site-config";

export const Route = createFileRoute("/telecomunicacoes")({
  head: () => ({
    meta: [
      { title: "Cabeamento e telecomunicações em Fortaleza | VSB" },
      {
        name: "description",
        content:
          "Cabeamento, organização de rede e diagnóstico de conectividade em Fortaleza e região metropolitana. Atendimento com Neto, Radioamador Classe A.",
      },
      { property: "og:title", content: "Telecomunicações em Fortaleza | VSB" },
      { property: "og:url", content: absoluteUrl("/telecomunicacoes") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/telecomunicacoes") }],
  }),
  component: Telecomunicacoes,
});

function Telecomunicacoes() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Telecomunicações · Fortaleza e região metropolitana"
        title={
          <>
            Cabeamento e conectividade em <span className="text-primary">Fortaleza.</span>
          </>
        }
        subtitle="Organização de rede e diagnóstico de conectividade com atenção à infraestrutura, à alimentação e a cada equipamento. Atendimento em Fortaleza e região metropolitana."
      />

      <Section>
        <SectionHeading
          eyebrow="Infraestrutura e diagnóstico"
          title="Cuidado em cada conexão."
          subtitle="Uma instalação organizada facilita a identificação de falhas, a manutenção e o uso diário dos sistemas."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <ServiceCard
            icon={Cable}
            title="Cabeamento e infraestrutura"
            description="Instalação, identificação e revisão de cabos e conexões para redes e sistemas eletrônicos."
          />
          <ServiceCard
            icon={Network}
            title="Organização de rede"
            description="Organização de racks, pontos e conexões para facilitar o acesso aos equipamentos e a manutenção."
          />
          <ServiceCard
            icon={Activity}
            title="Diagnóstico de conectividade"
            description="Verificação de alimentação, cabos, conexões e equipamentos para investigar quedas e falhas de comunicação."
          />
        </div>
      </Section>

      <Section className="border-y border-border bg-card">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Conhecimento aplicado
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl">A experiência de quem entende o sistema.</h2>
          </div>
          <div className="space-y-5 leading-relaxed text-muted-foreground">
            <p>
              Neto reúne experiência prática em elétrica, eletrônica e telecomunicações. Como
              Radioamador Classe A, traz também a vivência com sinais, equipamentos e comunicação
              para sua forma de investigar problemas técnicos.
            </p>
            <p>
              Na VSB, o diagnóstico considera como as partes se relacionam: uma falha de conexão
              pode envolver desde um cabo ou conector até a alimentação do equipamento. O trabalho
              começa pela escuta do problema e pela avaliação dessa infraestrutura.
            </p>
          </div>
        </div>
      </Section>

      <FAQSection
        items={[
          {
            question: "A VSB avalia cabeamento já instalado?",
            answer:
              "Sim. A avaliação considera o estado dos cabos, conectores, identificação e organização da infraestrutura para orientar correções ou substituições necessárias.",
          },
          {
            question: "Uma câmera sem conexão pode ter problema de alimentação?",
            answer:
              "Sim. Falhas na alimentação podem interromper a comunicação ou reiniciar o equipamento. Por isso, a análise considera o sistema elétrico e as conexões de rede em conjunto.",
          },
          {
            question: "Como solicitar uma avaliação de conectividade?",
            answer:
              "Informe quais equipamentos apresentam o problema, quando ele ocorre e se houve alguma mudança recente. Fotos do cabeamento e do rack também ajudam a entender o cenário inicial.",
          },
        ]}
      />
      <CTASection
        title="Uma conexão falhando merece investigação."
        subtitle="Descreva o problema para Neto e receba orientação sobre a avaliação da sua infraestrutura."
        service="cabeamento ou conectividade"
        equipmentHint="Equipamentos e modelos envolvidos, como roteador, switch ou câmera, se souber."
        buttonLabel="Avaliar minha conexão"
      />
    </SiteShell>
  );
}
