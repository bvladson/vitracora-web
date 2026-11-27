# VITRACORA CMS

**Digital Experience Platform**

> Arquitetura de experiência digital: site institucional, CMS headless e captação de leads.
>
> **A Vladson Labs Project** · Developed by Vladson Bezerra
> Participação autoral: Desenvolvimento original. O WordPress, usado como CMS, é de terceiros.

Site institucional da VSB (vsbseguranca.com.br): identidade visual, conteúdo gerenciável,
captação de leads, catálogo de produtos e serviços, páginas legais e hub de vídeos.
No ar desde **11/09/2026**, com publicações incrementais até setembro de 2026.

**Stack:** TanStack Start (SSR), React, TypeScript, Tailwind, Docker em VPS Ubuntu.
WordPress headless como CMS de conteúdo.

```
site/                      a aplicação (54 arquivos TypeScript)
marca/                     logos oficiais em vetor e bitmap
entrega-identidade-visual/ prancha de identidade em PDF e os arquivos entregues
docs/                      registro de cada publicação e das auditorias
ops/                       40 scripts de publicação e auditoria automatizada
```

## O site

Páginas por área de atuação — elétrica, eletrônica, energia, telecomunicações, segurança
eletrônica — mais portões automáticos, bicicletas elétricas, condomínios e empresas,
portfólio, blog, produtos e serviços com página própria por item, contato, privacidade e
termos. Sitemap e robots gerados pela aplicação.

**Identidade:** paleta off-white, petróleo, grafite e cobre discreto. Manrope e Inter
servidas pelo próprio domínio — sem folha de estilo externa bloqueando a renderização, o que
mantém o SSR e os testes determinísticos.

## O que diferencia este projeto

A parte interessante não é o site, é o **rigor na publicação**. `ops/` tem 40 scripts Python
que fazem o trabalho que normalmente se faz no olho:

| Script | O que verifica |
| --- | --- |
| `audit_accessibility.py` | Acessibilidade com axe, no site servido |
| `check_official_logos.py` | Se a logo publicada é mesmo o arquivo oficial |
| `audit_youtube_runtime.py` | Se o hub de vídeos funciona em produção, não só em teste |
| `check_google_integrations.py` | GA4, GTM, AdSense e consentimento, no HTML real |
| `check_google_edge_cases.py` | Os casos de borda do consentimento |
| `verify_production.py` | Conferência final do que está no ar |

**Consentimento levado a sério:** publicidade e análise são escolhas independentes. A
configuração inicial pausa as solicitações de anúncio até a escolha; aceitar análise **não**
aceita publicidade. As preferências podem ser revistas pelo rodapé a qualquer momento.

**Nada sem comprovação.** O checklist de publicação (`site/PUBLICACAO.md`) proíbe
explicitamente depoimento, número de clientes, certificação ou garantia que não possa ser
comprovada — e exige substituir imagem demonstrativa por registro autorizado antes de
publicar. A imagem institucional gerada por IA está identificada como ilustrativa, com o
prompt e a origem registrados no repositório.

**Segredo nunca é escrito em disco local.** `ops/youtube_credentials.py` configura a chave da
API direto no runtime da VPS, em arquivo com modo `0600` acessível só pelo root, sem nunca
imprimir ou gravar o valor na máquina de desenvolvimento.

## Sobre esta cópia pública

O endereço real da VPS foi trocado pelo IP de documentação `203.0.113.10` (RFC 5737). Os
identificadores de GA4, GTM e AdSense que aparecem na documentação são públicos por natureza
— qualquer visitante os lê no HTML do site. O telefone e o e-mail são os canais públicos de
atendimento da VSB. Nenhuma credencial foi versionada em nenhum momento.

---

## Autoria

Projeto meu — concepção, arquitetura, implementação, implantação e operação em produção.
Durante o desenvolvimento usei assistentes de IA (Codex e Claude) como ferramenta de apoio;
a condução e as decisões técnicas são minhas.
