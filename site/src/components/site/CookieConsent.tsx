import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import {
  captureAttribution,
  getCookieConsent,
  getAdvertisingConsent,
  setCookieConsent,
  type CookieConsent as ConsentValue,
} from "@/lib/analytics";

export const OPEN_COOKIE_SETTINGS_EVENT = "vsb:open-cookie-settings";

/**
 * Faixa discreta no rodapé, não modal.
 *
 * Permite aceitar, recusar e rever análise e publicidade separadamente.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(getCookieConsent() === null || getAdvertisingConsent() === null);
    setAnalytics(getCookieConsent() === "accepted");
    setAdvertising(getAdvertisingConsent() === "accepted");

    const open = () => {
      setReopened(true);
      setVisible(true);
      setCustomizing(true);
      setAnalytics(getCookieConsent() === "accepted");
      setAdvertising(getAdvertisingConsent() === "accepted");
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open);
  }, []);

  // Só move o foco quando o visitante pediu para rever as preferências.
  // Roubar o foco na primeira visita seria tão intrusivo quanto o modal.
  useEffect(() => {
    if (visible && reopened) panelRef.current?.focus();
  }, [visible, reopened]);

  const choose = (value: ConsentValue, ads: ConsentValue = "rejected") => {
    setCookieConsent(value, ads);
    if (value === "accepted") captureAttribution();
    setVisible(false);
    setReopened(false);
    setCustomizing(false);
  };

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-[60] max-h-[80dvh] overflow-y-auto animate-slide-up border-t border-primary/25 bg-card/98 shadow-[0_-8px_40px_rgba(18,59,74,.10)] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
        <div className="flex flex-1 items-start gap-3">
          <span className="mt-0.5 hidden h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary sm:grid">
            <Cookie className="h-5 w-5" />
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">Sua privacidade.</strong> Escolha se
            deseja permitir cookies para análise de acesso e publicidade sem personalização.{" "}
            <Link to="/privacidade" className="font-semibold text-primary hover:underline">
              Política de privacidade
            </Link>
            .
          </p>
        </div>

        {customizing && (
          <fieldset className="flex flex-col gap-3 text-sm lg:max-w-xs">
            <legend className="mb-2 font-semibold text-foreground">Cookies opcionais</legend>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="h-4 w-4 accent-[#123B4A]"
              />
              Análise de acesso
            </label>
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={advertising}
                onChange={(e) => setAdvertising(e.target.checked)}
                className="h-4 w-4 accent-[#123B4A]"
              />
              Publicidade sem personalização
            </label>
          </fieldset>
        )}
        <div className="flex shrink-0 flex-wrap gap-2 pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="min-h-11 flex-1 rounded-lg border border-input px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground lg:flex-none"
          >
            Somente necessários
          </button>
          <button
            type="button"
            onClick={() =>
              customizing
                ? choose(analytics ? "accepted" : "rejected", advertising ? "accepted" : "rejected")
                : choose("accepted")
            }
            className="min-h-11 flex-1 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-px lg:flex-none"
          >
            {customizing ? "Salvar preferências" : "Aceitar análise"}
          </button>
          {!customizing && (
            <button
              type="button"
              onClick={() => setCustomizing(true)}
              className="min-h-11 w-full text-sm font-semibold text-primary underline underline-offset-4 lg:w-auto lg:px-3"
            >
              Personalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
