import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  DoorClosed,
  Plug,
  CircuitBoard,
  Bike,
  ShieldCheck,
} from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero, SectionHeading } from "@/components/site/Section";
import { CTASection } from "@/components/site/CTASection";
import { absoluteUrl } from "@/lib/site-config";
import { getCmsCollection, plainText } from "@/lib/cms";

export const Route = createFileRoute("/servicos")({
  loader: async () => {
    try {
      return await getCmsCollection({ data: { collection: "servicos-cms" } });
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  head: () => ({
    meta: [
      { title: "Serviços | VSB Soluções Técnicas" },
      {
        name: "description",
        content:
          "Soluções em elétrica, eletrônica, energia, telecomunicações e segurança eletrônica. Conheça as áreas de atuação e os serviços técnicos da VSB.",
      },
      { property: "og:title", content: "Serviços VSB" },
      {
        property: "og:description",
        content: "Cinco áreas de atuação, com diagnóstico e cuidado técnico em cada trabalho.",
      },
      { property: "og:url", content: absoluteUrl("/servicos") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/servicos") }],
  }),
  component: Servicos,
});

const AREAS = [
  {
    title: "Elétrica",
    to: "/eletrica",
    description: "Instalações, quadros, proteções e manutenção da infraestrutura elétrica.",
  },
  {
    title: "Eletrônica",
    to: "/fontes-eletronicos",
    description: "Diagnóstico em bancada, reparo de placas, fontes e componentes.",
  },
  {
    title: "Energia",
    to: "/energia",
    description: "Alimentação de equipamentos, nobreaks, carregadores e baterias.",
  },
  {
    title: "Telecomunicações",
    to: "/telecomunicacoes",
    description: "Cabeamento, organização de rede e diagnóstico de conectividade.",
  },
  {
    title: "Segurança eletrônica",
    to: "/seguranca-eletronica",
    description: "Câmeras, alarmes, interfonia e sistemas de controle de acesso.",
  },
] as const;

const CATEGORIES = [
  {
    icon: ShieldCheck,
    title: "Segurança Eletrônica",
    to: "/seguranca-eletronica",
    items: [
      "Instalação de câmeras CFTV",
      "Câmeras IP e analógicas",
      "DVR, NVR e gravação",
      "Câmeras Wi-Fi",
      "Alarmes residenciais e comerciais",
      "Sensores de presença",
      "Sensores magnéticos",
      "Sirenes",
      "Cerca elétrica",
      "Interfone",
      "Videoporteiro",
      "Fechadura elétrica",
      "Controle de acesso por tag, senha ou biometria",
      "Infraestrutura de cabeamento",
      "Organização de rack e rede",
    ],
  },
  {
    icon: DoorClosed,
    title: "Portões Automáticos",
    to: "/portoes-automaticos",
    items: [
      "Instalação de motor",
      "Manutenção preventiva",
      "Troca de central",
      "Configuração de controles",
      "Fotocélula",
      "Fim de curso",
      "Cremalheira",
      "Capacitor",
      "Destravamento",
      "Ajuste mecânico e elétrico",
    ],
  },
  {
    icon: Plug,
    title: "Instalações Elétricas",
    to: "/eletrica",
    items: [
      "Instalação elétrica residencial e comercial",
      "Revisão de quadro elétrico",
      "Disjuntores, DR e DPS",
      "Aterramento",
      "Tomadas e circuitos dedicados",
      "Iluminação externa",
      "Sensores de presença",
      "Automação simples",
      "Infraestrutura para CFTV e portões",
      "Manutenção preventiva",
    ],
  },
  {
    icon: CircuitBoard,
    title: "Fontes e Bancada Técnica",
    to: "/fontes-eletronicos",
    items: [
      "Fontes chaveadas",
      "Fontes anti-curto",
      "Fontes 12V, 24V e outras",
      "Fontes para câmeras",
      "Fontes para portões",
      "Fontes para controle de acesso",
      "Placas eletrônicas",
      "Solda e substituição de componentes",
      "Diagnóstico de curto",
      "Teste de carga",
      "Dimensionamento por amperagem",
    ],
  },
  {
    icon: Bike,
    title: "Bicicletas Elétricas",
    to: "/bicicletas-eletricas",
    items: [
      "Troca de bateria",
      "Reparo de chicote",
      "Motor elétrico",
      "Controladora",
      "Placa interna de comando",
      "Display",
      "Acelerador",
      "Carregador",
      "BMS",
      "Diagnóstico completo",
    ],
  },
  {
    icon: Camera,
    title: "Manutenção e Suporte",
    to: "/condominios-empresas",
    items: [
      "Contratos preventivos",
      "Visitas programadas",
      "Atendimento emergencial",
      "Diagnóstico técnico",
      "Substituição de equipamentos",
      "Reorganização de infraestrutura",
      "Suporte para condomínios e empresas",
    ],
  },
];

function Servicos() {
  const cmsServices = Route.useLoaderData();
  return (
    <SiteShell>
      <PageHero
        eyebrow="VSB · Soluções técnicas"
        title={
          <>
            Conhecimento técnico para <span className="text-primary">resolver.</span>
          </>
        }
        subtitle="Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica. Áreas que se conectam pela experiência prática e pelo cuidado em cada diagnóstico."
      />
      <Section>
        <SectionHeading
          eyebrow="Áreas de atuação"
          title="Cinco áreas. Atenção a cada detalhe."
          subtitle="Neto reúne conhecimento de bancada e experiência em campo para avaliar equipamentos e instalações como parte de um conjunto."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {AREAS.map(({ title, to, description }, index) => (
            <Link key={to} to={to} className="card-tech group flex h-full flex-col">
              <span className="text-xs font-semibold tabular-nums text-primary">0{index + 1}</span>
              <h3 className="mt-6 text-lg">{title}</h3>
              <p className="mb-6 mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Conhecer a área <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <Section className="border-t border-border">
        <SectionHeading
          eyebrow="Serviços específicos"
          title="O trabalho na prática."
          subtitle="Conheça as aplicações, os equipamentos atendidos e as possibilidades de manutenção."
        />
        {cmsServices.length > 0 && (
          <div className="mb-12 mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cmsServices.map((service) => (
              <Link
                key={service.id}
                to="/servicos/$slug"
                params={{ slug: service.slug }}
                className="card-tech group"
              >
                <span className="chip-tag">Serviço</span>
                <h3 className="mt-4 text-xl font-bold">{plainText(service.title.rendered)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plainText(service.excerpt.rendered)}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary">
                  Ver detalhes <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {CATEGORIES.map(({ icon: Icon, title, items, to }) => (
            <article key={title} className="card-tech">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg border border-primary/40 bg-background/60 text-primary">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-foreground/90">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {s}
                  </li>
                ))}
              </ul>
              <Link
                to={to}
                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary"
              >
                Ver detalhes <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </Section>
      <CTASection />
    </SiteShell>
  );
}
