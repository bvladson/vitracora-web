// Public values can be configured at deploy time with the variables documented
// in .env.example. Keep the fallbacks obvious so placeholder data is never
// mistaken for production configuration.
import { attributionForContact } from "@/lib/analytics";

const env = import.meta.env;

export const SITE_URL = env.VITE_SITE_URL || "https://seudominio.com.br";

export const COMPANY = {
  name: "VSB Soluções técnicas",
  shortName: "VSB",
  tagline: "Conhecimento técnico para entender e resolver.",
  // Quem atende o WhatsApp. Aparece nos rótulos dos botões e nas mensagens
  // pré-preenchidas, para o visitante saber com quem vai falar.
  contactPerson: "Neto",
  phoneDisplay: env.VITE_PHONE_DISPLAY || "(85) 9XXXX-XXXX",
  phoneNumber: env.VITE_PHONE_NUMBER || "+5585999999999",
  whatsappNumber: env.VITE_WHATSAPP_NUMBER || "5585999999999",
  email: env.VITE_CONTACT_EMAIL || "contato@seudominio.com.br",
  city: "Fortaleza - CE",
  areaServed: "Fortaleza e região metropolitana",
  openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-13:00"],
  defaultWhatsAppMessage: "Olá Neto! Quero conversar sobre uma solução técnica.",
};

export const CONTACT_CONFIGURED =
  !SITE_URL.includes("seudominio") &&
  !COMPANY.phoneDisplay.includes("X") &&
  COMPANY.whatsappNumber !== "5585999999999" &&
  !COMPANY.email.includes("seudominio");

export function absoluteUrl(path = "/") {
  const base = SITE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function buildWhatsAppUrl(message = COMPANY.defaultWhatsAppMessage, source = "Site VSB") {
  const attribution = attributionForContact();
  const identifiedMessage = `${message.trim()}\n\nOrigem: ${source}.${
    attribution ? `\nAtribuição consentida: ${attribution}.` : ""
  }`;
  return `https://wa.me/${COMPANY.whatsappNumber}?text=${encodeURIComponent(identifiedMessage)}`;
}

export const WHATSAPP_URL = buildWhatsAppUrl();

export const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "ProfessionalService"],
  name: COMPANY.name,
  alternateName: COMPANY.shortName,
  description:
    "Soluções em elétrica, eletrônica, energia, telecomunicações e segurança eletrônica, com a experiência prática de Neto, Radioamador Classe A.",
  url: SITE_URL,
  telephone: COMPANY.phoneNumber,
  email: COMPANY.email,
  image: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg"),
  logo: absoluteUrl("/logo-principal-oficial-20260911.png"),
  areaServed: COMPANY.areaServed,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Fortaleza",
    addressRegion: "CE",
    addressCountry: "BR",
  },
  openingHours: COMPANY.openingHours,
  priceRange: "Sob consulta",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Soluções VSB",
    itemListElement: [
      "Elétrica",
      "Eletrônica",
      "Energia",
      "Telecomunicações",
      "Segurança eletrônica",
      "Portões automáticos",
      "Controle de acesso",
      "Manutenção elétrica",
      "Fontes e eletrônicos",
    ].map((name) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name } })),
  },
  serviceType: [
    "Elétrica",
    "Eletrônica",
    "Energia",
    "Telecomunicações",
    "Segurança eletrônica",
    "Instalação de câmeras CFTV",
    "Manutenção de portões automáticos",
    "Cerca elétrica",
    "Controle de acesso",
    "Manutenção elétrica",
    "Fontes eletrônicas",
    "Bicicletas elétricas",
  ],
};
