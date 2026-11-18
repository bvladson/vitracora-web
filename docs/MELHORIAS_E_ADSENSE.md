# VSB — melhorias e Google AdSense

Publicação: 14/09/2026. Site: https://vsbseguranca.com.br

## Identificadores e instalação

- AdSense: `ca-pub-8202925663264045`, script assíncrono no cabeçalho compartilhado, `crossorigin="anonymous"` e metatag `google-adsense-account`.
- Arquivo https://vsbseguranca.com.br/ads.txt: `google.com, pub-8202925663264045, DIRECT, f08c47fec0942fa0`.
- GTM `GTM-5WZFCV6P`, GA4 `G-BP931PJG0R` e Reader Revenue Manager `CAow2uPHDA:openaccess` preservados.
- Publicidade sem personalização, com escolha independente da análise. A configuração inicial pausa solicitações de anúncios até a escolha de publicidade; aceitar análise não aceita publicidade. Preferências podem ser revistas no rodapé.
- Política de Privacidade atualizada no WordPress, incluindo finalidade de publicidade e os cookies de preferências. O carregamento técnico do script Google é informado na política.
- CSP autoriza os hosts do AdSense e da verificação de tráfego encontrados nos testes, sem liberar `unsafe-eval`.

A inclusão do código não equivale à aprovação comercial. No painel AdSense, marcar **Adicionei o código**, clicar em **Verificar** e depois **Pedir revisão**. A análise e aprovação são realizadas pelo Google.

## Melhorias incluídas

- Formulário só confirma o recebimento quando o WordPress retorna um ID de registro. Envio pendente impede duplicidade; falhas preservam campos e oferecem WhatsApp/e-mail. Nenhuma mensagem é aberta ou enviada automaticamente.
- Eventos GA4 `generate_lead` após registro confirmado e `whatsapp_click` enviados diretamente ao identificador da conta, respeitando consentimento. Os parâmetros desses eventos não incluem nome, telefone, descrição ou mensagem pré-preenchida.
- Catálogo: 324 itens, separados em 143 equipamentos e 181 serviços; 131 categorias carregadas com hierarquia. Filtros, busca e paginação permanecem na URL. Serviços utilizam dados estruturados `Service`.
- Nome institucional atualizado nos textos dos 324 itens, preservando IDs, slugs, preços, estoque e categorias.
- Três artigos técnicos publicados, com referências e autoria institucional VSB. Post padrão Hello world colocado em rascunho.
- Página “Como trabalhamos” substitui a apresentação de portfólio sem acervo real. Imagens ilustrativas identificadas; não foram inventados projetos, depoimentos ou credenciais.
- Apresentação de Neto e cinco áreas técnicas com atendimento em Fortaleza e região, metadados locais e contatos contextualizados. Logo oficial e identidade institucional mantidos.

## Verificação

- `bun run check:publish`: configuração pública, ESLint e build de produção aprovados.
- Evidências do navegador em `checks-improvements/`: AdSense, consentimento, páginas, catálogo, telas de celular e verificação de acessibilidade.
- `contact.json`: recebimento real confirmado no WordPress; registro sintético removido por ID e campos exclusivos do teste. Estado pendente, duplicidade, falha e eventos testados. Google respondeu HTTP204 a `generate_lead` e `whatsapp_click`. Nenhuma mensagem WhatsApp/e-mail foi enviada.
- `public-http.json`: verificação após publicação, incluindo cabeçalho, ads.txt, robots, sitemap, catálogo, contato e páginas legais.
- A pesquisa configurada no Reader Revenue Manager continua ativa; foi fechada pelo botão próprio durante os testes de navegação.
- A auditoria final de contraste e acessibilidade do conteúdo do site usa um contexto isolado, com a pesquisa externa do Reader Revenue Manager desativada somente no teste. A instalação pública do AdSense foi conferida separadamente com os scripts reais do Google ativos.

## Operação e recuperação

- Fonte final: `/opt/vsb-site/source-improvements-20260914-final`; link `/opt/vsb-site/current`.
- Imagem: `vsb-site:improvements-20260914-final`; container `vsb-site`; porta local `3006`.
- Nginx: `/etc/nginx/sites-available/vsbseguranca.com.br`.
- Backup: `/root/vsb-backup-improvements-20260914`, incluindo configuração anterior e cópia dos conteúdos alterados no CMS.
- Container anterior preservado: `vsb-site-before-improvements-20260914`, porta local `3004`.
- A verificação final identificou contraste insuficiente nos números de áreas de atuação em telas pequenas. Os números passaram a usar azul petróleo. Cópia anterior a esse ajuste em `vsb-site-before-improvements-final-20260914`, porta `3005`, backup `/root/vsb-backup-improvements-20260914-final`.
- Retorno da aplicação anterior: `/root/vsb-backup-improvements-20260914/rollback-site.sh`. O retorno da aplicação não desfaz os textos do CMS; a cópia anterior destes está em `cms/before.json` para recuperação seletiva.
- Variáveis de execução preservadas em arquivo exclusivo do root na VPS; credenciais não incluídas neste documento.

Referência Google: https://support.google.com/adsense/answer/7584263?hl=pt-BR
