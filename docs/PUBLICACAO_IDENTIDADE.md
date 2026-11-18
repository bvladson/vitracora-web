# VSB · Soluções técnicas — entrega de 11/09/2026

Atualização posterior: as logos oficiais enviadas pelo usuário já substituem a marca da proposta no site. Consulte [LOGOS_OFICIAIS.md](LOGOS_OFICIAIS.md) para arquivos e estado atual da VPS; o estado abaixo registra a publicação inicial.

Site publicado: https://vsbseguranca.com.br/

## Implementação

- Paleta off-white, petróleo, grafite e cobre discreto em todo o site.
- Manrope e Inter servidas pelo próprio domínio; licenças em `site/public/fonts`.
- Logotipo vetorial, favicon e imagem de compartilhamento atualizados.
- Página inicial com cinco áreas de atuação, apresentação de Neto e Radioamador Classe A, método de diagnóstico e contato direto.
- Novas páginas `/energia` e `/telecomunicacoes`, menu, rodapé, formulário e sitemap integrados.
- Imagem de bancada gerada por IA, identificada como ilustrativa. Arquivo: `site/src/assets/bench-institutional.webp`; prompt e origem em `site/docs/imagem-institucional.md`.
- Catálogo, conteúdo do CMS, integração de leads, contatos e preferências de cookies preservados.

## Materiais entregues

- `entrega/vsb-identidade-visual.zip`: pacote com 31 arquivos.
- `entrega/vsb-identidade-visual/pdf/vsb-identidade-prancha.pdf`: apresentação vetorial.
- `entrega/vsb-identidade-visual/guia/identidade-visual.md`: guia de uso.
- `entrega/vsb-identidade-visual/vetores`: logos e aplicações em SVG com letras em curvas.
- `entrega/vsb-identidade-visual/png`: logos transparentes, avatar, Instagram e prévias digitais.
- `checks/publicado-desktop.png` e `checks/publicado-mobile.png`: capturas do site publicado.

Cartões e aplicações são modelos de identidade; a gráfica deve preparar sangria, cor e acabamento antes da produção.

## Validação realizada

- `check:publish`: configuração pública, ESLint/Prettier e build aprovados.
- TypeScript `tsc --noEmit`: aprovado na imagem de validação.
- 15 páginas responderam HTTP 200, com um H1 cada e sem erros de JavaScript.
- Verificações de largura: inicial em 320, 390, 768, 1024 e 1440 px; demais páginas em 390 e 1440 px, sem overflow horizontal.
- Menus desktop/mobile, Escape e foco, navegação para Telecomunicações, validação obrigatória do formulário, opções de serviços, contatos e persistência de cookies verificados.
- Não foram enviados formulários reais nem mensagens de WhatsApp durante os testes.
- Axe: nenhuma violação automática WCAG A/AA nas seis páginas avaliadas após a correção de contraste na paginação. Isso não substitui uma auditoria manual completa de acessibilidade.
- Após a publicação: inicial, Energia, Telecomunicações, catálogo, contato, fontes, imagens, robots e sitemap verificados no domínio público, sem erros no navegador.
- Relatórios: `checks/report.json`, `checks/accessibility.json` e `checks/production.json`.

## Estado da VPS

- Fonte: `/opt/vsb-site/source-identity-20260911`.
- Imagem Docker: `vsb-site:identity-20260911`.
- Container ativo: `vsb-site`, porta local `127.0.0.1:3001`.
- Nginx do domínio público aponta para a porta 3001; TLS e políticas existentes mantidos.
- Configuração de runtime e integração de leads preservadas. Nenhum segredo foi copiado para a entrega local ou para os arquivos públicos.
- Container anterior: `vsb-site-before-identity-20260911`, preservado na porta 3000.
- Backup: `/root/vsb-backup-identity-20260911`, incluindo fonte anterior, configuração Nginx e configuração original do container.
- Reversão na VPS: `/root/vsb-backup-identity-20260911/rollback.sh` (uso administrativo; retorna Nginx e nome do container à versão anterior).

A pasta original `biomie` não foi modificada. O trabalho da VSB está separado em `C:/Users/VLADSON/Downloads/vsb-identidade`.
