# Google Analytics 4 instalado diretamente — 11/09/2026

Tag fornecida pelo usuário: **G-BP931PJG0R**, publicada em https://vsbseguranca.com.br/ usando `gtag.js`.

O documento global carrega o script assíncrono e executa `gtag('js', new Date())` e `gtag('config', 'G-BP931PJG0R')`. Reutiliza o `dataLayer` e a função `gtag` existentes. As configurações de consentimento executam antes do comando de configuração da propriedade.

Foram alterados apenas `src/lib/google-integrations.ts` e `src/routes/__root.tsx` da aplicação. A instalação anterior do Tag Manager e Reader Revenue Manager foi preservada.

## Medição e consentimento

- A configuração pública da propriedade habilita medição automática de carregamentos e eventos de histórico. O Google mede as navegações SPA.
- Os eventos próprios enviados como objetos para `dataLayer` não são reenviados manualmente ao GA4; isso evita uma segunda implementação de visualizações. O contêiner GTM estava vazio no último teste, em 11/09/2026.
- Antes do consentimento, `analytics_storage` permanece negado e não são criados cookies `_ga`. O modo de consentimento existente permite sinais sem cookies, conforme informado na Política de Privacidade.
- O aceite concede armazenamento analítico. A recusa e a revogação atualizam o Google. Armazenamento e personalização de anúncios permanecem negados.
- Nenhum evento de envio de formulário ou WhatsApp foi provocado para testar a instalação.

Referências: [instalação e medição de pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views), [medição de aplicações SPA](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [configuração de consentimento](https://developers.google.com/tag-platform/security/guides/consent).

## Publicação

- Fonte local: `site-ga4/`.
- Fonte remota: `/opt/vsb-site/source-ga4-20260911`, apontada por `/opt/vsb-site/current`.
- Imagem: `vsb-site:ga4-20260911`.
- Container ativo: `vsb-site`, porta `127.0.0.1:3004`.
- Container anterior preservado: `vsb-site-before-ga4-20260911`, porta 3003.
- Backup e reversão: `/root/vsb-backup-ga4-20260911/rollback-site.sh`.
- Variáveis de ambiente preservadas na VPS, com arquivo restrito; credenciais não copiadas para a entrega.

## Verificação

Validação de configuração, ESLint/Prettier e build de produção aprovados. Testes de navegador em preview e produção registram somente metadados dos eventos, sem identificadores de visitantes.

Conferidos: `config` uma única vez, consentimento antes da configuração, carregamento direto, visualização única de `/`, `/eletrica` e `/energia`, referências de navegação corretas, respostas HTTP 204 do endpoint de coleta, ausência de cookies GA antes de consentimento, aceite e revogação, ausência de erros de aplicação/CSP, layout em desktop e celular.

Evidências: `checks-ga4/preview.json`, `checks-ga4/production.json` e screenshots. A resposta de coleta confirma que o endpoint aceitou os envios; o painel privado do Google Analytics não foi acessado para consultar relatórios.
