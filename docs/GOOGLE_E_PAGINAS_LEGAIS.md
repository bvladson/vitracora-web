# Integrações Google e páginas legais — 11/09/2026

Atualização posterior: a tag GA4 foi instalada diretamente. Consulte [GOOGLE_ANALYTICS_4.md](GOOGLE_ANALYTICS_4.md) para a fonte e publicação atuais. O erro 403 do Reader Revenue Manager foi resolvido pela autorização do domínio no Google e confirmado no reteste de 11/09/2026.

Código publicado em https://vsbseguranca.com.br/. Fonte atual em `site-legal/`; as pastas `site/` e `site-logo/` são versões anteriores.

## Google

- Google Tag Manager: `GTM-5WZFCV6P`, bootstrap no `<head>` e iframe `<noscript>` imediatamente após a abertura do `<body>`.
- Reader Revenue Manager: script oficial `swg-basic.js`, produto `CAow2uPHDA:openaccess`, `NewsArticle`, `Product`, tema claro e `pt-BR`, conforme código fornecido.
- Scripts globais não são reinstalados nas mudanças de rota. Visualizações são deduplicadas durante a montagem da interface.
- CSP do Nginx permite os recursos necessários do Google; nenhum bloqueio de CSP nos testes finais.
- Consent Mode: padrão antes do GTM, análise inicialmente negada; aceite libera somente `analytics_storage`. Anúncios permanecem negados. Recusa/revogação atualizam o Google, inclusive quando o armazenamento local lança erro.
- Cookie de preferência `vsb_cookie_consent_v2`, 180 dias. A versão anterior não concede silenciosamente consentimento para a nova finalidade. RRM carrega independentemente dessa escolha; isso é informado na Política de Privacidade.

**Pendências externas confirmadas:** o contêiner público GTM está na versão 1, sem tags ou regras publicadas. A instalação está conectada, mas nenhuma tag GA4 foi criada neste trabalho. A API do RRM retorna 403 para a origem `https://vsbseguranca.com.br` e 200 com CORS autorizado para `https://cms.vsbseguranca.com.br`. É necessário incluir/autorizar o domínio principal na publicação do Publisher Center. O JavaScript do RRM carrega com HTTP 200, mas seus recursos não estão operacionais no domínio principal enquanto essa configuração estiver pendente. Nenhuma aprovação do Google é presumida.

Referência técnica: [CSP e Tag Manager](https://developers.google.com/tag-platform/security/guides/csp) e [Consent Mode](https://developers.google.com/tag-platform/security/guides/consent).

## Documentos públicos no WordPress

- Termos: https://cms.vsbseguranca.com.br/termos-de-servico/ — página 351.
- Privacidade: https://cms.vsbseguranca.com.br/politica-de-privacidade/ — página 352, definida como política oficial nas configurações do WordPress.
- Edição pelo [painel WordPress](https://cms.vsbseguranca.com.br/wp-admin/edit.php?post_type=page).
- Layout mínimo, logo oficial, Manrope/Inter hospedadas localmente, off-white e azul petróleo, detalhes em cobre.
- Sem login, formulários, scripts, cookies ou rastreadores nessas duas páginas.
- Plugin MU `wp-content/mu-plugins/vsb-legal-pages.php` e template `vsb-legal-pages/template.php`. Exceção do modo WooCommerce Coming Soon limitada às duas páginas por metadado, sem mudar o modo da loja.
- Assets em `wp-content/uploads/vsb-legal-assets/`.
- Rodapé do site liga diretamente aos documentos. `/privacidade`, `/termos-de-servico` e os respectivos aliases `/pagina/...` redirecionam em HTTP 301 para as URLs canônicas no CMS.
- Texto explica o registro do formulário no atendimento antes da abertura do WhatsApp, escolhas de cookies e serviços Google. Sem CNPJ, razão social ou prazo de retenção inventados. Contato público existente: contato@vsbseguranca.com.br / (85) 98629-3430.

Referências para redação: [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm), [direitos do titular — ANPD](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1), [privacidade do Google](https://policies.google.com/privacy?hl=pt-BR). O texto não representa certificação ou aprovação jurídica/Google.

## Publicação e reversão

- VPS: `/opt/vsb-site/source-google-legal-20260911`; `/opt/vsb-site/current` aponta para essa fonte.
- Container `vsb-site`, imagem `vsb-site:google-legal-20260911`, porta `127.0.0.1:3003`, com rotação de logs e reinício automático.
- Versão anterior preservada em `vsb-site-before-google-legal-20260911`, porta 3002.
- Backup: `/root/vsb-backup-google-legal-20260911`. `rollback-site.sh` restaura Nginx, nomes dos containers e fonte anterior.
- Estado anterior das páginas/configuração de privacidade em `legal-files/pages-before.json`; publicações em `legal-files/published.json`. Páginas antigas não foram excluídas nem sobrescritas. O rascunho de privacidade 3 foi preservado.
- Configuração Nginx sincronizada na fonte em `deploy/nginx-vsbseguranca.conf` e `deploy/nginx-vsb-live.conf`.
- Arquivos de ambiente e credenciais permanecem restritos na VPS; não incluídos neste pacote.

## Verificação

Validação de configuração, ESLint/Prettier, compilação de produção e PHP lint aprovados. Testes no domínio público: posição e carregamento dos scripts, consentimento inicial/aceite/recusa/revogação, armazenamento indisponível, consentimento antigo, navegação SPA sem scripts ou visualizações duplicadas, fallback sem JavaScript, links e redirecionamentos legais. Documentos em 1440, 390 e 320 px: HTTP 200, HTML e H1 únicos, idioma pt-BR, canonical, fontes/logo, sem overflow ou tela Coming Soon.

Evidências em `checks-google-legal/`: `google-production.json`, `google-edge-cases.json`, `cms-legal-production.json` e screenshots. O relatório Google registra explicitamente a falha externa de configuração do RRM; não há erro próprio da aplicação nem bloqueio CSP nos testes finais.
