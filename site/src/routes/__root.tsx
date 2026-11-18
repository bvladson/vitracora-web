import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LOCAL_BUSINESS_SCHEMA, absoluteUrl } from "../lib/site-config";
import {
  GTM_ID,
  ADSENSE_CLIENT_ID,
  GA4_MEASUREMENT_ID,
  GOOGLE_ANALYTICS_BOOTSTRAP,
  GOOGLE_TAG_MANAGER_BOOTSTRAP,
  READER_REVENUE_BOOTSTRAP,
} from "../lib/google-integrations";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado ao carregar esta página. Tente atualizar ou volte para o início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VSB · Soluções técnicas" },
      {
        name: "description",
        content:
          "Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica. Diagnóstico, instalação e manutenção com a experiência prática de Neto em Fortaleza e região metropolitana.",
      },
      { name: "author", content: "VSB" },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { name: "theme-color", content: "#123B4A" },
      { name: "google-adsense-account", content: ADSENSE_CLIENT_ID },
      { property: "og:title", content: "VSB · Soluções técnicas" },
      {
        property: "og:description",
        content:
          "Conhecimento técnico para entender e resolver. Elétrica, eletrônica, energia, telecomunicações e segurança eletrônica.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:url", content: absoluteUrl("/") },
      { property: "og:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absoluteUrl("/og-vsb-logo-oficial-20260911.jpg") },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/manrope-latin-variable.woff2",
        crossOrigin: "anonymous",
      },
      { rel: "icon", href: "/favicon-oficial-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-oficial-64.png", type: "image/png", sizes: "64x64" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon-oficial.png", sizes: "180x180" },
      // A fonte é descoberta só depois que o CSS baixa e é analisado.
      // O preload a coloca na fila junto com o CSS e evita o salto de
      // texto na primeira renderização.
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/fonts/inter-latin-variable.woff2",
        crossOrigin: "anonymous",
      },
      // O CMS serve as imagens do catálogo: abrir a conexão cedo economiza
      // o DNS e o handshake TLS quando as imagens começarem a carregar.
      { rel: "preconnect", href: "https://cms.vsbseguranca.com.br", crossOrigin: "anonymous" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          id="vsb-gtm-bootstrap"
          dangerouslySetInnerHTML={{ __html: GOOGLE_TAG_MANAGER_BOOTSTRAP }}
        />
        <HeadContent />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          data-privacy-treatments="disablePersonalization"
        />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`} />
        <script
          id="vsb-google-analytics"
          dangerouslySetInnerHTML={{ __html: GOOGLE_ANALYTICS_BOOTSTRAP }}
        />
        <script
          async
          type="application/javascript"
          src="https://news.google.com/swg/js/v1/swg-basic.js"
        />
        <script
          id="vsb-reader-revenue"
          dangerouslySetInnerHTML={{ __html: READER_REVENUE_BOOTSTRAP }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();
  const pending = useRouterState({ select: (state) => state.status === "pending" });
  const [showProgress, setShowProgress] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShowProgress(false);
      return;
    }
    // Navegações resolvidas em menos de 180 ms não mostram nada: um flash
    // de barra é mais perturbador do que a troca instantânea.
    const timer = window.setTimeout(() => setShowProgress(true), 180);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <>
      {showProgress && <RouteProgress />}
      <div key={location.pathname} className="page-enter">
        <Outlet />
      </div>
    </>
  );
}

/**
 * Barra fina no topo, no lugar do overlay em tela cheia que a versão
 * anterior usava. Mantém o feedback de carregamento sem esconder a página
 * que o visitante já estava lendo.
 */
function RouteProgress() {
  return (
    <div
      className="route-progress"
      role="progressbar"
      aria-label="Carregando página"
      aria-busy="true"
    />
  );
}
