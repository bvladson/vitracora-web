import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Radio, Plus } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { absoluteUrl, buildWhatsAppUrl, COMPANY } from "@/lib/site-config";
import { trackWhatsAppClick } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { QuoteChecklist } from "@/components/site/CTASection";
import { YouTubeSection } from "@/components/site/YouTubeSection";
import benchImg from "@/assets/bench-institutional.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VSB | Soluções técnicas em Fortaleza e região" },
      {
        name: "description",
        content:
          "Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica em Fortaleza. Diagnóstico, instalação e manutenção com a experiência prática de Neto, Radioamador Classe A.",
      },
      { property: "og:title", content: "VSB · Soluções técnicas em Fortaleza" },
      {
        property: "og:description",
        content:
          "Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica em Fortaleza e região metropolitana. Atendimento direto com Neto.",
      },
      { property: "og:url", content: absoluteUrl("/") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Home,
});

const areas = [
  {
    n: "01",
    title: "Elétrica",
    description:
      "Instalações, quadros, proteção e infraestrutura. Cuidado com cada circuito e conexão.",
    detail: "Instalação · Proteção · Manutenção",
    to: "/eletrica",
  },
  {
    n: "02",
    title: "Eletrônica",
    description:
      "Fontes, placas e equipamentos. Medição e diagnóstico para entender a origem da falha.",
    detail: "Diagnóstico · Bancada · Reparo",
    to: "/fontes-eletronicos",
  },
  {
    n: "03",
    title: "Energia",
    description:
      "Alimentação, fontes, baterias e nobreaks. Atenção ao que mantém seus sistemas funcionando.",
    detail: "Alimentação · Dimensionamento · Testes",
    to: "/energia",
  },
  {
    n: "04",
    title: "Telecomunicações",
    description:
      "Conectividade, cabeamento e sistemas de comunicação. Conhecimento técnico de ponta a ponta.",
    detail: "Conexão · Infraestrutura · Diagnóstico",
    to: "/telecomunicacoes",
  },
  {
    n: "05",
    title: "Segurança eletrônica",
    description:
      "Câmeras, alarmes, interfonia e controle de acesso. Equipamentos integrados ao seu ambiente.",
    detail: "CFTV · Acesso · Integração",
    to: "/seguranca-eletronica",
  },
] as const;

function Home() {
  return (
    <SiteShell>
      <section className="identity-hero">
        <div className="identity-container hero-layout">
          <div className="hero-copy">
            <p className="identity-eyebrow">
              <span /> Fortaleza e região metropolitana
            </p>
            <h1>
              Entender a fundo.
              <br />
              Resolver <span className="hero-last">com técnica.</span>
            </h1>
            <p className="hero-description">
              Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica. Atendimento
              direto com Neto para avaliar, instalar e cuidar dos seus sistemas.
            </p>
            <div className="hero-actions">
              <a
                href={buildWhatsAppUrl(
                  "Olá Neto! Gostaria de solicitar uma avaliação técnica.\n\nEquipamento ou sistema e modelo:\nProblema ou necessidade:\nBairro e cidade:",
                  "Página inicial — apresentação",
                )}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => trackWhatsAppClick("home_hero")}
                className="btn-neon"
              >
                Fale com o Neto <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href="#areas" className="identity-text-link">
                Conheça as soluções <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="hero-signature">
              <span className="signature-line" />
              <p>
                Atendimento direto. Diagnóstico cuidadoso.
                <br />
                <strong>Trabalho técnico com responsabilidade.</strong>
              </p>
            </div>
          </div>
          <figure className="hero-figure">
            <div className="hero-photo">
              <img
                src={benchImg}
                alt="Composição ilustrativa de bancada com multímetro, placa eletrônica e instrumentos de medição"
                width={1536}
                height={1024}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <div className="hero-photo-note">
              <span className="photo-number">VSB / 01</span>
              <span>Precisão começa no diagnóstico.</span>
              <Plus size={17} aria-hidden="true" />
            </div>
            <figcaption>Bancada técnica · imagem ilustrativa</figcaption>
          </figure>
        </div>
        <div className="identity-container">
          <div className="expertise-strip">
            <span>
              Uma base técnica.
              <br />
              <strong>Múltiplas soluções.</strong>
            </span>
            <p>
              Elétrica <i /> Eletrônica <i /> Energia <i /> Telecomunicações <i /> Segurança
              eletrônica
            </p>
          </div>
        </div>
      </section>
      <section id="areas" className="identity-section identity-areas">
        <div className="identity-container">
          <div className="identity-section-heading">
            <div>
              <p className="identity-eyebrow">
                <span /> Áreas de atuação
              </p>
              <h2>
                Cada sistema tem sua lógica.
                <br />
                Nós cuidamos dos detalhes.
              </h2>
            </div>
            <p>
              Do circuito ao sistema completo, a solução começa por compreender o que está
              acontecendo.
            </p>
          </div>
          <div className="area-list">
            {areas.map((area) => (
              <Link key={area.n} to={area.to} className="area-row">
                <span className="area-number">{area.n}</span>
                <h3>{area.title}</h3>
                <div>
                  <p>{area.description}</p>
                  <span className="area-detail">{area.detail}</span>
                </div>
                <span className="area-arrow">
                  <ArrowUpRight size={21} strokeWidth={1.5} />
                </span>
              </Link>
            ))}
          </div>
          <div className="area-footnote">
            <p>
              Também cuidamos de portões automáticos, bicicletas elétricas e soluções para
              condomínios e empresas.
            </p>
            <Link to="/servicos" className="identity-text-link">
              Todos os serviços <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section id="neto" className="identity-section neto-section">
        <div className="identity-container neto-layout">
          <div className="neto-profile">
            <p className="identity-eyebrow">
              <span /> Quem está à frente
            </p>
            <div className="neto-name">
              Neto<span>.</span>
            </div>
            <p className="neto-role">
              Responsável pelos serviços da VSB.
              <br />
              Da bancada ao atendimento em campo.
            </p>
            <div className="neto-credential">
              <Radio size={28} strokeWidth={1.4} aria-hidden="true" />
              <div>
                <strong>Radioamador Classe A</strong>
                <span>Vivência em comunicação e tecnologia</span>
              </div>
            </div>
          </div>
          <div className="neto-copy">
            <h2>
              Técnica de quem entende
              <br />
              como as coisas funcionam.
            </h2>
            <p>
              Neto é o profissional responsável pelos trabalhos da VSB. Reúne experiência prática em
              elétrica, eletrônica e telecomunicações, conectando o funcionamento dos componentes às
              necessidades de cada instalação.
            </p>
            <p>
              O cuidado está em ouvir, investigar a causa e explicar a solução. Da análise em
              bancada à execução em campo, atenção aos detalhes e respeito pelo trabalho bem feito.
            </p>
            <div className="neto-principle">
              <span>O princípio é simples</span>
              <p>
                Entender o problema.
                <br />
                <strong>Fazer o trabalho com critério.</strong>
              </p>
            </div>
            <a
              href={buildWhatsAppUrl(
                "Olá Neto! Quero conversar sobre um serviço técnico.",
                "Página inicial — sobre Neto",
              )}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackWhatsAppClick("home_neto")}
              className="identity-text-link"
            >
              Converse com quem vai cuidar do serviço <ArrowUpRight size={17} />
            </a>
          </div>
        </div>
      </section>
      <section className="identity-section">
        <div className="identity-container">
          <div className="identity-section-heading">
            <div>
              <p className="identity-eyebrow">
                <span /> Método de trabalho
              </p>
              <h2>
                Antes da solução,
                <br />
                um bom diagnóstico.
              </h2>
            </div>
            <p>
              Clareza em cada etapa. Para você entender a necessidade, a proposta e o trabalho
              realizado.
            </p>
          </div>
          <div className="method-grid">
            {[
              [
                "01",
                "Ouvir e entender",
                "Conversamos sobre a necessidade, o comportamento do equipamento e o contexto da instalação.",
              ],
              [
                "02",
                "Medir e diagnosticar",
                "Avaliamos o sistema, verificamos conexões e buscamos a causa do problema.",
              ],
              [
                "03",
                "Explicar e executar",
                "Apresentamos o caminho indicado e realizamos o serviço com organização e cuidado.",
              ],
              [
                "04",
                "Testar e orientar",
                "Verificamos o funcionamento e orientamos sobre o uso e os cuidados com o sistema.",
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span>{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="identity-resources">
        <div className="identity-container resources-layout">
          <div>
            <p className="identity-eyebrow">
              <span /> Técnica na prática
            </p>
            <h2>
              Conheça o trabalho.
              <br />
              Encontre o que precisa.
            </h2>
          </div>
          <div className="resource-links">
            <Link to="/portfolio">
              <span>
                <strong>Como trabalhamos</strong>
                <small>Do diagnóstico aos testes de funcionamento</small>
              </span>
              <ArrowUpRight size={22} />
            </Link>
            <Link to="/produtos">
              <span>
                <strong>Catálogo técnico</strong>
                <small>Equipamentos para sua solução</small>
              </span>
              <ArrowUpRight size={22} />
            </Link>
            <Link to="/blog">
              <span>
                <strong>Conteúdo técnico</strong>
                <small>Conhecimento para decidir melhor</small>
              </span>
              <ArrowUpRight size={22} />
            </Link>
          </div>
        </div>
      </section>
      <YouTubeSection />
      <section className="identity-contact">
        <div className="identity-container contact-layout">
          <div>
            <p className="identity-eyebrow">
              <span /> Vamos conversar
            </p>
            <h2>
              O que você
              <br />
              precisa resolver?
            </h2>
            <p className="mt-[22px] max-w-[370px] text-sm leading-[1.8] text-[#DAE2E4]">
              Conte ao Neto sobre seu equipamento, sistema ou necessidade técnica.
            </p>
            <QuoteChecklist
              equipmentHint="Modelo do equipamento ou descrição da instalação, se souber."
              dark
            />
          </div>
          <div className="contact-action">
            <a
              href={buildWhatsAppUrl(
                "Olá Neto! Preciso de uma avaliação técnica.\n\nEquipamento ou sistema e modelo:\nProblema ou necessidade:\nBairro e cidade:",
                "Página inicial — contato",
              )}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackWhatsAppClick("home_closing")}
              className="contact-button"
            >
              <WhatsAppIcon className="h-5 w-5" /> Fale com o Neto <ArrowUpRight size={18} />
            </a>
            <span>{COMPANY.phoneDisplay}</span>
            <p>{COMPANY.areaServed}</p>
            <Link to="/contato">
              Outras formas de contato <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
