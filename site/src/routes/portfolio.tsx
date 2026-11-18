import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero, SectionHeading } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import heroImg from "@/assets/hero-security.webp";
import benchImg from "@/assets/bench-institutional.webp";
import gateImg from "@/assets/gate-night.webp";
import ebikeImg from "@/assets/ebike.webp";
import condoImg from "@/assets/condo.webp";
import { absoluteUrl } from "@/lib/site-config";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Como trabalhamos — Diagnóstico e execução | VSB Fortaleza" },
      {
        name: "description",
        content:
          "Entenda o atendimento da VSB em Fortaleza e região: escuta, diagnóstico, proposta, execução e testes. Conheça o método de trabalho de Neto.",
      },
      { property: "og:title", content: "Como trabalhamos | VSB Soluções técnicas" },
      { property: "og:url", content: absoluteUrl("/portfolio") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/portfolio") }],
  }),
  component: Portfolio,
});

const EXAMPLES = [
  {
    img: gateImg,
    tag: "Portão automático",
    title: "Avaliação do conjunto",
    text: "A avaliação considera acionamento, central e parte mecânica para investigar a causa da falha.",
    to: "/portoes-automaticos",
  },
  {
    img: heroImg,
    tag: "CFTV residencial",
    title: "Cobertura bem planejada",
    text: "A necessidade de cobertura orienta a escolha de câmeras, os pontos de instalação e a gravação.",
    to: "/seguranca-eletronica",
  },
  {
    img: benchImg,
    tag: "Fontes e placas",
    title: "Diagnóstico em bancada",
    text: "Medições e testes ajudam a avaliar o reparo antes de recomendar a substituição de componentes.",
    to: "/fontes-eletronicos",
  },
  {
    img: condoImg,
    tag: "Condomínio",
    title: "Perímetro integrado",
    text: "Câmeras, interfonia e controle de acesso são avaliados conforme a infraestrutura e a rotina do local.",
    to: "/condominios-empresas",
  },
  {
    img: ebikeImg,
    tag: "Bike elétrica",
    title: "Sistema elétrico completo",
    text: "O diagnóstico considera bateria, carregador, controladora e conexões como partes do mesmo conjunto.",
    to: "/bicicletas-eletricas",
  },
  {
    img: benchImg,
    tag: "Elétrica",
    title: "Proteção e organização",
    text: "A revisão considera circuitos, conexões, proteções e identificação para orientar a intervenção.",
    to: "/eletrica",
  },
] as const;

function Portfolio() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Como trabalhamos · Fortaleza e região"
        title={
          <>
            Entender o problema. Explicar a solução.{" "}
            <span className="text-primary">Cuidar da execução.</span>
          </>
        }
        subtitle="O atendimento com Neto começa pela necessidade de quem usa o equipamento. Conheça as etapas que orientam o diagnóstico, a proposta e a execução do serviço."
      />
      <Section>
        <SectionHeading
          eyebrow="Clareza em cada etapa"
          title="Um processo que você pode acompanhar."
          subtitle="A avaliação pode acontecer em bancada ou no local, conforme o equipamento e a instalação. As condições são combinadas antes do agendamento."
        />
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "01",
              "Entender",
              "Você informa o equipamento, o sintoma e o local. Neto conversa sobre o que mudou e como o sistema é usado.",
            ],
            [
              "02",
              "Diagnosticar",
              "A avaliação considera medições, conexões e condições de funcionamento para investigar a origem do problema.",
            ],
            [
              "03",
              "Combinar e executar",
              "O diagnóstico orienta a proposta. Escopo e condições são apresentados para combinar a execução do serviço.",
            ],
            [
              "04",
              "Testar e orientar",
              "Após a intervenção, verificamos o funcionamento e explicamos os cuidados de uso e manutenção.",
            ],
          ].map(([number, title, description]) => (
            <li key={number} className="border-t border-border pt-5">
              <span className="text-sm font-semibold text-[#92512C]">{number}</span>
              <h3 className="mt-3 text-lg">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
      </Section>
      <Section className="border-t border-border bg-card">
        <SectionHeading
          eyebrow="Aplicações do método"
          title="A mesma atenção, em diferentes sistemas."
          subtitle="Os exemplos abaixo apresentam tipos de atendimento da VSB. As imagens são ilustrativas e não representam serviços realizados."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((c) => (
            <article
              key={c.tag}
              className="overflow-hidden rounded-xl border border-border bg-background"
            >
              <figure>
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={c.img}
                    alt={`Imagem ilustrativa de ${c.tag.toLowerCase()}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 chip-tag">{c.tag}</span>
                </div>
                <figcaption className="px-5 pt-3 text-xs text-muted-foreground">
                  Imagem ilustrativa
                </figcaption>
              </figure>
              <div className="p-5">
                <h3 className="text-base font-bold">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
                <Link
                  to={c.to}
                  className="mt-5 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Conhecer o atendimento
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>
      <CTASection
        title="Vamos entender o seu caso."
        subtitle="Conte a Neto o que precisa funcionar melhor. A conversa inicial ajuda a definir o próximo passo para avaliar o equipamento ou a instalação."
        equipmentHint="Marca e modelo do equipamento ou descrição do sistema, se souber."
        buttonLabel="Conversar sobre meu atendimento"
      />
    </SiteShell>
  );
}
