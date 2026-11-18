import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Phone, Mail, MapPin, Send, LoaderCircle, Camera as CameraIcon } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Section, PageHero } from "@/components/site/Section";
import { COMPANY, absoluteUrl, buildWhatsAppUrl } from "@/lib/site-config";
import { attributionForContact, trackEvent, trackWhatsAppClick } from "@/lib/analytics";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
import { submitLead } from "@/lib/leads";
import { JsonLd } from "@/components/site/JsonLd";
import { breadcrumbSchema } from "@/lib/structured-data";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e orçamento técnico em Fortaleza | VSB" },
      {
        name: "description",
        content:
          "Solicite avaliação técnica em Fortaleza e região metropolitana. Fale com Neto sobre elétrica, eletrônica, energia, telecomunicações e segurança eletrônica.",
      },
      { property: "og:title", content: "Contato VSB" },
      { property: "og:url", content: absoluteUrl("/contato") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/contato") }],
  }),
  component: Contato,
});

function Contato() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const submitting = useRef(false);
  const [whatsAppUrl, setWhatsAppUrl] = useState("");
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    servico: "Diagnóstico técnico",
    ambiente: "Residência",
    bairro: "",
    descricao: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || status === "sent") return;
    submitting.current = true;
    setStatus("sending");

    const msg =
      `Olá Neto! Quero um orçamento.\n\n` +
      `Nome: ${form.nome}\nTelefone: ${form.telefone}\n` +
      `Serviço: ${form.servico}\nAmbiente: ${form.ambiente}\n` +
      `Bairro: ${form.bairro}\n\nDescrição: ${form.descricao}`;
    const url = buildWhatsAppUrl(msg, "Formulário de orçamento da página de contato");
    setWhatsAppUrl(url);

    try {
      const result = await submitLead({
        data: { ...form, atribuicao: attributionForContact() },
      });
      if (result.stored) {
        setStatus("sent");
        trackEvent("generate_lead", { service: form.servico, environment: form.ambiente });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  };

  const mailtoUrl = `mailto:${COMPANY.email}?subject=${encodeURIComponent(
    `Orçamento — ${form.servico}`,
  )}&body=${encodeURIComponent(
    `Nome: ${form.nome}\nTelefone: ${form.telefone}\nServiço: ${form.servico}\n` +
      `Ambiente: ${form.ambiente}\nBairro: ${form.bairro}\n\nDescrição: ${form.descricao}`,
  )}`;

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [k]: e.target.value });
      if (status === "sent" || status === "error") {
        setStatus("idle");
        setWhatsAppUrl("");
      }
    };

  const inputCls =
    "w-full rounded-md border border-input bg-background/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <SiteShell>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Contato", path: "/contato" },
        ])}
      />
      <PageHero
        eyebrow="Contato"
        title={
          <>
            Fale com a <span className="text-gradient-neon">VSB</span>.
          </>
        }
        subtitle="Atendimento em Fortaleza e região metropolitana. Descreva o que precisa e envie fotos pelo WhatsApp para ajudar na avaliação inicial."
      />
      <Section>
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="card-tech">
              <h2 className="text-2xl font-bold">Solicitar orçamento</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Envie sua necessidade para a VSB. Depois da confirmação, você também pode continuar
                a conversa e enviar fotos pelo WhatsApp.
              </p>
              <form
                onSubmit={submit}
                aria-busy={status === "sending"}
                className="mt-6 grid gap-4 sm:grid-cols-2"
              >
                <fieldset disabled={status === "sending"} className="contents">
                  <label className="block text-sm sm:col-span-1">
                    <span className="mb-1.5 block font-medium text-foreground">Nome</span>
                    <input
                      required
                      autoComplete="name"
                      maxLength={120}
                      pattern={".*\\S.*"}
                      title="Informe seu nome."
                      value={form.nome}
                      onChange={onChange("nome")}
                      placeholder="Seu nome"
                      className={inputCls}
                    />
                  </label>
                  <label className="block text-sm sm:col-span-1">
                    <span className="mb-1.5 block font-medium text-foreground">Telefone</span>
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={40}
                      pattern={"[+0-9\\s\\(\\)\\.\\-]{8,40}"}
                      title="Informe um telefone com DDD."
                      value={form.telefone}
                      onChange={onChange("telefone")}
                      placeholder={COMPANY.phoneDisplay}
                      className={inputCls}
                    />
                  </label>
                  <label className="block text-sm sm:col-span-1">
                    <span className="mb-1.5 block font-medium text-foreground">
                      Tipo de serviço
                    </span>
                    <select
                      value={form.servico}
                      onChange={onChange("servico")}
                      className={inputCls}
                    >
                      {[
                        "Diagnóstico técnico",
                        "Elétrica",
                        "Eletrônica",
                        "Energia",
                        "Telecomunicações",
                        "Segurança eletrônica",
                        "Portão automático",
                        "Cerca elétrica",
                        "Fontes e eletrônicos",
                        "Bicicleta elétrica",
                        "Outros",
                      ].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-1">
                    <span className="mb-1.5 block font-medium text-foreground">Ambiente</span>
                    <select
                      value={form.ambiente}
                      onChange={onChange("ambiente")}
                      className={inputCls}
                    >
                      {["Residência", "Condomínio", "Empresa / Galpão", "Comércio"].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1.5 block font-medium text-foreground">
                      Bairro / cidade
                    </span>
                    <input
                      autoComplete="address-level2"
                      maxLength={120}
                      value={form.bairro}
                      onChange={onChange("bairro")}
                      placeholder="Onde fica o atendimento?"
                      className={inputCls}
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1.5 block font-medium text-foreground">
                      Descrição do problema
                    </span>
                    <textarea
                      required
                      rows={4}
                      maxLength={4000}
                      value={form.descricao}
                      onChange={onChange("descricao")}
                      placeholder="Conte o que está acontecendo. Quanto mais detalhes, melhor o diagnóstico."
                      className={inputCls}
                    />
                  </label>
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={status === "sending" || status === "sent"}
                      className="btn-neon disabled:cursor-default disabled:opacity-60"
                    >
                      {status === "sending" ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="h-5 w-5" aria-hidden="true" />
                      )}
                      {status === "sending"
                        ? "Enviando solicitação…"
                        : status === "sent"
                          ? "Solicitação enviada"
                          : status === "error"
                            ? "Tentar novamente"
                            : "Enviar solicitação"}
                    </button>
                    <a
                      href={buildWhatsAppUrl(
                        "Olá Neto! Quero enviar uma foto para avaliação.",
                        "Envio de foto na página de contato",
                      )}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={() => trackWhatsAppClick("contact_send_photo")}
                      className="btn-ghost-neon"
                    >
                      <CameraIcon className="h-4 w-4" /> Enviar foto do problema
                    </a>
                  </div>
                </fieldset>
                <p className="sm:col-span-2 text-xs leading-relaxed text-muted-foreground">
                  Ao enviar, seus dados serão registrados pela VSB para responder ao pedido de
                  orçamento. O envio de uma mensagem no WhatsApp é uma etapa opcional. Consulte
                  nossa{" "}
                  <a
                    href="https://cms.vsbseguranca.com.br/politica-de-privacidade/"
                    className="font-semibold text-primary"
                  >
                    política de privacidade
                  </a>
                  .
                </p>
                {(status === "sent" || status === "error") && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="sm:col-span-2 rounded-xl border border-primary/30 bg-primary/8 p-4"
                  >
                    {status === "sent" ? (
                      <p className="text-sm leading-relaxed text-foreground">
                        <strong className="text-primary">Solicitação registrada.</strong> A VSB
                        recebeu seus dados para avaliar o atendimento. Para continuar a conversa ou
                        enviar fotos do equipamento, use o WhatsApp abaixo.
                      </p>
                    ) : (
                      <p className="text-sm leading-relaxed text-foreground">
                        <strong className="text-primary">
                          Não foi possível confirmar o registro.
                        </strong>{" "}
                        Seus campos foram mantidos. Tente novamente ou envie a solicitação pelo
                        WhatsApp ou e-mail abaixo.
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={() => trackWhatsAppClick("contact_form_retry")}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
                      >
                        <WhatsAppIcon className="h-4 w-4" /> Abrir no WhatsApp
                      </a>
                      <a
                        href={mailtoUrl}
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-4 w-4" /> Enviar por e-mail
                      </a>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          <aside className="space-y-5 lg:col-span-2">
            <a
              href={buildWhatsAppUrl(
                "Olá Neto! Quero falar diretamente sobre um atendimento.",
                "Atendimento direto na página de contato",
              )}
              target="_blank"
              rel="noreferrer noopener"
              onClick={() => trackWhatsAppClick("contact_direct")}
              className="card-tech block"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <WhatsAppIcon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Falar com o {COMPANY.contactPerson}</h3>
                  <p className="text-sm text-muted-foreground">
                    WhatsApp direto, com resposta rápida no horário comercial.
                  </p>
                </div>
              </div>
            </a>
            <div className="card-tech">
              <h3 className="text-base font-bold">Outros contatos</h3>
              <ul className="mt-4 space-y-3 text-sm text-foreground/90">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${COMPANY.phoneNumber}`} className="hover:text-primary">
                    {COMPANY.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <a href={`mailto:${COMPANY.email}`} className="hover:text-primary">
                    {COMPANY.email}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" /> {COMPANY.areaServed}.
                </li>
              </ul>
            </div>
            <div className="card-tech">
              <h3 className="text-base font-bold">Atendimento</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>Seg – Sex · 08h às 18h</li>
                <li>Sáb · 09h às 13h</li>
                <li>Emergências sob consulta</li>
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </SiteShell>
  );
}
