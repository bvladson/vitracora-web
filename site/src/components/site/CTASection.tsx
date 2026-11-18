import { Link, useLocation } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/site-config";
import { trackWhatsAppClick } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";

const SERVICE_BY_PATH: Record<string, string> = {
  "/eletrica": "elétrica",
  "/fontes-eletronicos": "fontes e eletrônicos",
  "/energia": "fontes, nobreaks e baterias",
  "/telecomunicacoes": "cabeamento e conectividade",
  "/seguranca-eletronica": "segurança eletrônica",
  "/portoes-automaticos": "portões automáticos",
  "/bicicletas-eletricas": "bicicletas elétricas",
  "/condominios-empresas": "atendimento para condomínio ou empresa",
};

export function QuoteChecklist({
  equipmentHint = "Qual equipamento ou instalação precisa de atendimento e o modelo, se souber.",
  dark = false,
}: {
  equipmentHint?: string;
  dark?: boolean;
}) {
  return (
    <div className={`mt-7 border-y py-5 text-left ${dark ? "border-white/20" : "border-border"}`}>
      <p className={`text-sm font-semibold ${dark ? "text-white" : "text-primary"}`}>
        Para começar, envie:
      </p>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {[
          ["Equipamento ou sistema", equipmentHint],
          ["Problema ou necessidade", "O que acontece ou o que você pretende instalar."],
          ["Bairro e cidade", "Para combinar o atendimento em Fortaleza e região."],
        ].map(([label, detail], index) => (
          <li key={label}>
            <span className={`text-xs font-semibold ${dark ? "text-white/70" : "text-[#92512C]"}`}>
              0{index + 1}
            </span>
            <strong
              className={`mt-1 block text-sm font-semibold ${dark ? "text-white" : "text-primary"}`}
            >
              {label}
            </strong>
            <p
              className={`mt-1 text-xs leading-relaxed ${dark ? "text-white/80" : "text-muted-foreground"}`}
            >
              {detail}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CTASection({
  title = "Vamos entender o que você precisa resolver.",
  subtitle = "Converse com Neto sobre seu equipamento, sistema ou necessidade técnica em Fortaleza e região metropolitana.",
  service,
  equipmentHint,
  buttonLabel = "Solicitar orçamento",
}: {
  title?: string;
  subtitle?: string;
  service?: string;
  equipmentHint?: string;
  buttonLabel?: string;
}) {
  const location = useLocation();
  const subject = service ?? SERVICE_BY_PATH[location.pathname] ?? "um serviço técnico";
  const message = `Olá Neto! Quero conversar sobre ${subject} e solicitar uma avaliação.\n\nEquipamento ou sistema e modelo:\nProblema ou necessidade:\nBairro e cidade:`;

  return (
    <section className="relative border-y border-[#123B4A]/10 bg-[#FFFFFF] py-20 sm:py-24">
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <span className="mx-auto mb-6 block h-px w-12 bg-[#C97941]" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#123B4A]">
          Conversa técnica, contato direto
        </span>
        <h2 className="mt-5 text-3xl leading-tight text-[#123B4A] sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#515A5E]">{subtitle}</p>
        <QuoteChecklist equipmentHint={equipmentHint} />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={buildWhatsAppUrl(message, `Página ${location.pathname} — ${subject}`)}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => trackWhatsAppClick("cta_section")}
            className="btn-neon"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {buttonLabel}
          </a>
          <Link to="/contato" className="btn-ghost-neon">
            Prefiro preencher o formulário <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mx-auto mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground">
          A conversa inicial ajuda a definir o atendimento. Visita, avaliação e condições do
          orçamento são combinadas com Neto antes de agendar.
        </p>
      </div>
    </section>
  );
}
