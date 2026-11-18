import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BatteryCharging,
  Bike,
  Building2,
  ChevronDown,
  CircuitBoard,
  DoorClosed,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Radio,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { buildWhatsAppUrl, COMPANY } from "@/lib/site-config";
import {
  captureAttribution,
  enrichWhatsAppLink,
  trackEvent,
  trackWhatsAppClick,
} from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { CookieConsent, OPEN_COOKIE_SETTINGS_EVENT } from "@/components/site/CookieConsent";
import { GoogleTags } from "@/components/site/GoogleTags";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Catálogo" },
  { to: "/portfolio", label: "Como trabalhamos" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
] as const;

const SERVICE_GROUPS = [
  {
    id: "areas",
    title: "Áreas de atuação",
    description: "Conhecimento técnico para entender e resolver.",
    items: [
      {
        to: "/eletrica",
        label: "Elétrica",
        detail: "Instalações, proteção e infraestrutura",
        Icon: Zap,
      },
      {
        to: "/fontes-eletronicos",
        label: "Eletrônica",
        detail: "Equipamentos, circuitos e diagnóstico em bancada",
        Icon: CircuitBoard,
      },
      {
        to: "/energia",
        label: "Energia",
        detail: "Alimentação e funcionamento dos sistemas",
        Icon: BatteryCharging,
      },
      {
        to: "/telecomunicacoes",
        label: "Telecomunicações",
        detail: "Conhecimento aplicado à comunicação",
        Icon: Radio,
      },
      {
        to: "/seguranca-eletronica",
        label: "Segurança eletrônica",
        detail: "CFTV, alarmes, cercas, interfone e acesso",
        Icon: ShieldCheck,
      },
    ],
  },
  {
    id: "aplicacoes",
    title: "Aplicações e serviços",
    description: "O cuidado técnico aplicado ao dia a dia.",
    items: [
      {
        to: "/portoes-automaticos",
        label: "Portões automáticos",
        detail: "Motores, centrais, controles e mecânica",
        Icon: DoorClosed,
      },
      {
        to: "/bicicletas-eletricas",
        label: "Bicicletas elétricas",
        detail: "Bateria, motor, BMS e controladora",
        Icon: Bike,
      },
      {
        to: "/condominios-empresas",
        label: "Condomínios e empresas",
        detail: "Instalações e manutenção dos sistemas",
        Icon: Building2,
      },
    ],
  },
] as const;

export function Logo({ className = "", footer = false }: { className?: string; footer?: boolean }) {
  return (
    <Link
      to="/"
      className={`inline-flex shrink-0 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#123B4A] ${className}`}
      aria-label="VSB Soluções técnicas — início"
    >
      <img
        src="/logo-principal-oficial-20260911.png"
        alt="VSB Soluções técnicas"
        className={
          footer ? "h-auto w-[288px] max-w-full sm:w-[360px]" : "h-auto w-[216px] sm:w-[248px]"
        }
        width={2560}
        height={736}
        decoding="async"
      />
    </Link>
  );
}

function Header() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const servicesTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMenus = () => {
    setOpen(false);
    setServicesOpen(false);
  };

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open && !servicesOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setServicesOpen(false);
      setOpen(false);
      if (open) mobileTriggerRef.current?.focus();
      else servicesTriggerRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setServicesOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, servicesOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const onResize = () => {
      setOpen(false);
      setServicesOpen(false);
    };
    desktop.addEventListener("change", onResize);
    return () => {
      desktop.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeMenus();
      }}
      className="fixed inset-x-0 top-0 z-50 border-b border-[#123B4A]/10 bg-[#F5F3EE]/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav
          className="hidden items-center gap-1 font-display xl:flex"
          aria-label="Navegação principal"
        >
          <div
            className="relative"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setServicesOpen(false);
            }}
          >
            <button
              ref={servicesTriggerRef}
              type="button"
              onClick={() => setServicesOpen((value) => !value)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-expanded={servicesOpen}
              aria-controls="mega-menu-servicos"
            >
              Áreas de atuação
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {servicesOpen && (
              <div
                id="mega-menu-servicos"
                className="absolute left-1/2 top-full w-[760px] -translate-x-1/2 pt-3"
              >
                <div className="overflow-hidden rounded-xl border border-border bg-[#FFFFFF] shadow-xl shadow-[#123B4A]/10">
                  <div className="grid grid-cols-2 gap-7 p-6">
                    {SERVICE_GROUPS.map((group) => (
                      <section key={group.id} aria-labelledby={`menu-${group.id}`}>
                        <h2
                          id={`menu-${group.id}`}
                          className="text-xs font-bold uppercase tracking-[0.16em] text-primary"
                        >
                          {group.title}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
                        <div className="mt-4 grid gap-2">
                          {group.items.map(({ to, label, detail, Icon }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={closeMenus}
                              className="group flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-primary/30 hover:bg-secondary"
                            >
                              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                <Icon className="h-5 w-5" strokeWidth={1.8} />
                              </span>
                              <span>
                                <strong className="block text-sm text-foreground">{label}</strong>
                                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                  {detail}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-border bg-background/70 px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      Conheça as soluções e o trabalho da VSB.
                    </div>
                    <Link
                      to="/servicos"
                      onClick={closeMenus}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-foreground"
                    >
                      Todos os serviços <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="relative rounded-md px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={buildWhatsAppUrl(
              "Olá Neto! Quero conversar sobre uma solução técnica.",
              "Cabeçalho do site",
            )}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => trackWhatsAppClick("header")}
            className="btn-neon hidden text-sm sm:inline-flex"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Fale com o Neto
          </a>
          <button
            ref={mobileTriggerRef}
            type="button"
            onClick={() => {
              setOpen((value) => !value);
              setServicesOpen(false);
            }}
            className="grid h-11 w-11 place-items-center rounded-md border border-border text-foreground xl:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            aria-controls="menu-principal-mobile"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-border bg-background px-4 py-4 xl:hidden">
          <nav
            id="menu-principal-mobile"
            className="grid gap-1 font-display"
            aria-label="Navegação principal no celular"
          >
            <button
              type="button"
              onClick={() => setServicesOpen((value) => !value)}
              className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-expanded={servicesOpen}
              aria-controls="servicos-mobile"
            >
              Áreas de atuação
              <ChevronDown
                className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {servicesOpen && (
              <div
                id="servicos-mobile"
                className="mb-2 grid gap-4 rounded-xl border border-border bg-card p-3"
              >
                {SERVICE_GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                      {group.title}
                    </p>
                    <div className="mt-1 grid gap-1">
                      {group.items.map(({ to, label, Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={closeMenus}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <Icon className="h-4 w-4 text-primary" /> {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <Link
                  to="/servicos"
                  onClick={closeMenus}
                  className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                >
                  Ver todos <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={closeMenus}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-primary" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
            <a
              href={buildWhatsAppUrl(
                "Olá Neto! Quero conversar sobre uma solução técnica.",
                "Menu do site",
              )}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => {
                trackWhatsAppClick("mobile_menu");
                closeMenus();
              }}
              className="btn-neon mt-3 justify-center"
            >
              <WhatsAppIcon className="h-5 w-5" /> Fale com o Neto
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-[#123B4A]/15 bg-[#F5F3EE] text-[#171A1C]">
      <div className="absolute left-4 top-0 h-px w-16 bg-[#C97941] sm:left-6 lg:left-8" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <Logo footer />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-[#515A5E]">
            Soluções em elétrica, eletrônica, energia, telecomunicações e segurança eletrônica.
            Experiência prática para entender os sistemas e cuidar de cada detalhe do trabalho.
          </p>
          <p className="mt-4 text-sm font-medium text-[#123B4A]">
            À frente da VSB, Neto. Radioamador Classe A.
          </p>
          <a
            href={buildWhatsAppUrl(
              "Olá Neto! Quero conversar sobre uma solução técnica.",
              "Rodapé do site",
            )}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => trackWhatsAppClick("footer")}
            className="btn-neon mt-6"
          >
            <WhatsAppIcon className="h-5 w-5" /> Falar com o {COMPANY.contactPerson}
          </a>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#123B4A]">
            Áreas de atuação
          </h2>
          <nav aria-label="Áreas de atuação no rodapé">
            <ul className="mt-5 space-y-3 text-sm text-[#515A5E]">
              {SERVICE_GROUPS[0].items.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="transition-colors hover:text-[#123B4A] hover:underline underline-offset-4"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  to="/servicos"
                  className="inline-flex items-center gap-2 font-semibold text-[#123B4A] hover:underline underline-offset-4"
                >
                  Todos os serviços <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#123B4A]">Contato</h2>
          <ul className="mt-5 space-y-4 text-sm text-[#515A5E]">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#123B4A]" aria-hidden="true" />
              <a href={`tel:${COMPANY.phoneNumber}`} className="hover:text-[#123B4A]">
                {COMPANY.phoneDisplay}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#123B4A]" aria-hidden="true" />
              <a href={`mailto:${COMPANY.email}`} className="break-all hover:text-[#123B4A]">
                {COMPANY.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#123B4A]" aria-hidden="true" />{" "}
              {COMPANY.areaServed}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#123B4A]/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 pb-24 text-xs text-[#515A5E] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-24 lg:px-8">
          <span>© {new Date().getFullYear()} VSB Soluções técnicas.</span>
          <a
            href="https://cms.vsbseguranca.com.br/politica-de-privacidade/"
            className="hover:text-[#123B4A]"
          >
            Política de Privacidade
          </a>
          <a
            href="https://cms.vsbseguranca.com.br/termos-de-servico/"
            className="hover:text-[#123B4A]"
          >
            Termos de Serviço
          </a>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
            className="text-left hover:text-[#123B4A]"
          >
            Preferências de cookies
          </button>
        </div>
      </div>
    </footer>
  );
}

function FloatingWhatsApp() {
  return (
    <a
      href={buildWhatsAppUrl("Olá Neto! Preciso de atendimento.", "Botão flutuante do site")}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Falar com o ${COMPANY.contactPerson} pelo WhatsApp`}
      onClick={() => trackWhatsAppClick("floating_button")}
      className="group fixed bottom-4 right-4 z-40 flex min-h-14 items-center gap-3 rounded-full border border-[#FFFFFF]/20 bg-[#123B4A] p-2.5 text-[#FFFFFF] shadow-[0_6px_24px_rgba(18,59,74,.18)] transition-colors hover:bg-[#24282B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#123B4A] sm:bottom-6 sm:right-6 sm:pr-5"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#FFFFFF] text-[#123B4A]">
        <WhatsAppIcon className="h-7 w-7" />
      </span>
      <span className="hidden text-left leading-tight sm:block">
        <strong className="block text-sm font-semibold">Falar com o {COMPANY.contactPerson}</strong>
        <span className="text-[11px] font-semibold opacity-80">Atendimento pelo WhatsApp</span>
      </span>
    </a>
  );
}

function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    captureAttribution();
    trackEvent("page_view", { path: location.pathname });
  }, [location.pathname]);
  useEffect(() => {
    const enrich = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href*="wa.me/"]');
      if (anchor) enrichWhatsAppLink(anchor);
    };
    document.addEventListener("click", enrich, true);
    return () => document.removeEventListener("click", enrich, true);
  }, []);
  return null;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        className="sr-only fixed left-4 top-4 z-[70] rounded-md bg-[#123B4A] px-5 py-3 font-semibold text-[#FFFFFF] focus:not-sr-only focus:fixed"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" tabIndex={-1} className="flex-1 pt-20 outline-none">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
      <GoogleTags />
      <AnalyticsTracker />
      <CookieConsent />
    </div>
  );
}
