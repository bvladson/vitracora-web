import { GA4_MEASUREMENT_ID } from "./google-integrations";

type AnalyticsValue = string | number | boolean | undefined;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, AnalyticsValue>>;
    gtag?: (...args: unknown[]) => void;
    adsbygoogle?: Array<unknown> & { pauseAdRequests?: number; requestNonPersonalizedAds?: number };
  }
}

export type CookieConsent = "accepted" | "rejected";

const CONSENT_COOKIE = "vsb_cookie_consent_v2";
const ADVERTISING_COOKIE = "vsb_advertising_consent_v1";
const ATTRIBUTION_KEY = "vsb_attribution";
let lastTrackedPage: string | null = null;

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.split("=").slice(1).join("=")) : null;
}

export function getCookieConsent(): CookieConsent | null {
  const value = readCookie(CONSENT_COOKIE);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function getAdvertisingConsent(): CookieConsent | null {
  const value = readCookie(ADVERTISING_COOKIE);
  return value === "accepted" || value === "rejected" ? value : null;
}

export function setCookieConsent(value: CookieConsent, advertising: CookieConsent = "rejected") {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
  document.cookie = `${ADVERTISING_COOKIE}=${advertising}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
  if (value === "rejected") {
    lastTrackedPage = null;
    try {
      localStorage.removeItem(ATTRIBUTION_KEY);
    } catch {
      // Consent must still be revoked when browser storage is unavailable.
    }
  }
  window.dispatchEvent(new CustomEvent("vsb:consent-updated", { detail: value }));
}

export function captureAttribution() {
  if (typeof window === "undefined" || getCookieConsent() !== "accepted") return;
  try {
    if (localStorage.getItem(ATTRIBUTION_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    let referrerHost = "";
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : "";
    } catch {
      referrerHost = "";
    }

    const attribution = {
      source: params.get("utm_source") || referrerHost || "direto",
      medium: params.get("utm_medium") || (referrerHost ? "referral" : "direct"),
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || "",
      term: params.get("utm_term") || "",
      landingPage: `${window.location.pathname}${window.location.search}`,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    // Optional attribution must not prevent consent or contact actions.
  }
}

export function attributionForContact() {
  if (typeof window === "undefined" || getCookieConsent() !== "accepted") return "";
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return "";
    const data = JSON.parse(raw) as {
      source?: string;
      medium?: string;
      campaign?: string;
      landingPage?: string;
    };
    return [
      data.source && `fonte: ${data.source}`,
      data.medium && `meio: ${data.medium}`,
      data.campaign && `campanha: ${data.campaign}`,
      data.landingPage && `entrada: ${data.landingPage}`,
    ]
      .filter(Boolean)
      .join(" | ");
  } catch {
    return "";
  }
}

export function enrichWhatsAppLink(anchor: HTMLAnchorElement) {
  const attribution = attributionForContact();
  if (!attribution || !anchor.href.includes("wa.me/")) return;
  const url = new URL(anchor.href);
  const message = url.searchParams.get("text") || "";
  if (message.includes("Atribuição consentida:")) return;
  url.searchParams.set("text", `${message}\nAtribuição consentida: ${attribution}.`);
  anchor.href = url.toString();
}

export function trackEvent(event: string, values: Record<string, AnalyticsValue> = {}) {
  if (typeof window === "undefined" || getCookieConsent() !== "accepted") return;
  if (event === "page_view") {
    const path = typeof values.path === "string" ? values.path : window.location.pathname;
    // The shared shell can update and remount during the same SPA navigation.
    if (path === lastTrackedPage) return;
    lastTrackedPage = path;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...values });
  // Page views remain automatic in GA4. Send only the two contact events;
  // names, phones, descriptions and prefilled WhatsApp URLs never enter here.
  if (event === "whatsapp_click" || event === "generate_lead") {
    const parameters: Record<string, AnalyticsValue> = {
      send_to: GA4_MEASUREMENT_ID,
      page_path: window.location.pathname,
    };
    for (const key of ["location", "service", "environment"]) {
      if (typeof values[key] === "string") parameters[key] = values[key].slice(0, 100);
    }
    window.gtag?.("event", event, parameters);
  }
}

export function trackWhatsAppClick(location: string) {
  trackEvent("whatsapp_click", { location });
}
