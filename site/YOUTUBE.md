# YouTube automático na VSB

Revisão de 16/09/2026. A seção `#youtube` permanece na home, entre **Técnica na prática** e **Vamos conversar**. Esta revisão mantém React/TypeScript, TanStack Start, Nitro, Docker/Nginx e a integração existente. A alteração visual fica limitada à seção de vídeos: azul-petróleo `#123B4A`, textos claros e vermelho nas ações do YouTube.

## Classificação por playlists

A classificação depende exclusivamente de playlists públicas escolhidas para cada formato. Duração, título, hashtag `#Shorts` e proporção da miniatura não determinam se um vídeo é Short.

Configuração privada, centralizada em `src/lib/config.server.ts` e passada ao container em tempo de execução:

```dotenv
YOUTUBE_API_KEY=
YOUTUBE_SHORTS_PLAYLIST_ID=
YOUTUBE_VIDEOS_PLAYLIST_ID=
YOUTUBE_CACHE_FILE=/app/data/youtube/videos-v2.json
```

Para preencher as duas áreas, criar ou escolher no canal uma playlist pública **Shorts** e outra de **Vídeos completos**, organizar os vídeos nos formatos correspondentes e copiar o valor de `list=` da URL de cada playlist para a variável indicada. Usar somente o ID, sem a URL completa. Os IDs não precisam ser alterados em componentes, no WordPress ou em arquivos públicos.

A playlist deve pertencer ao canal VSB e estar pública. A playlist automática de uploads não pode ser configurada como classificador de formato. Quando um vídeo pertence às duas playlists, ele aparece somente em Shorts. Vídeos duplicados na mesma playlist também aparecem uma única vez.

Sem essas variáveis, a sincronização dos uploads continua normalmente: a resposta os coloca em `recentVideos`, e a interface usa o título neutro **Últimas publicações**, sem classificá-los artificialmente como vídeos completos. O bloco de Shorts oferece um link para o canal quando ainda não há itens classificados. Uma categoria pode ser configurada independentemente da outra.

Na consulta de 16/09/2026, foi encontrada a playlist pública **Motores Automáticos Residencial**, mas nenhuma playlist separada por formato. Por isso os IDs de classificação permanecem vazios nesta configuração. O vídeo público encontrado permanece disponível como publicação recente; sua hashtag não foi usada para inferir o formato.

## Consulta da API

O componente consulta somente `GET /api/youtube/videos`. O backend usa a YouTube Data API v3:

1. `channels.list`, com `forHandle=@vsbseguranca` e `part=snippet,contentDetails`, resolve o canal e lê `contentDetails.relatedPlaylists.uploads`. Não deduz o ID pelo prefixo.
2. `playlistItems.list` busca até 12 candidatos dos uploads. `videos.list`, com `part=snippet,status`, recupera seus detalhes antes das consultas opcionais.
3. Se houver playlists configuradas, uma consulta `playlists.list` valida proprietário e visibilidade pública. `playlistItems.list` percorre até quatro páginas de 50 itens por playlist; as duas playlists são consultadas em paralelo.
4. Os detalhes adicionais são buscados com `videos.list` em lotes de até 50 IDs. Todo vídeo precisa pertencer ao canal, estar público e permitir incorporação. Itens apagados, privados, não listados, indisponíveis ou sem metadados válidos são descartados.
5. Ordena pela data real de publicação, separa por pertencimento às playlists e remove duplicatas. Retorna até **8 Shorts**, **4 vídeos completos** e **4 uploads sem classificação**. A propriedade legada `videos` contém os quatro mais recentes entre os itens dessas categorias.

A paginação permite encontrar um vídeo novo colocado depois da primeira página da playlist. O limite é **200 itens por playlist**, definido por `YOUTUBE_PLAYLIST_SCAN_LIMIT`; para coleções maiores, ordenar a playlist por publicações mais recentes no YouTube ou organizar coleções menores. A ordenação final no site usa a data do vídeo, não a data em que ele foi acrescentado à playlist.

Não há chamadas a `search.list`. Cada chamada a `playlistItems.list` custa uma unidade de quota, conforme a documentação oficial. O número de chamadas acompanha as páginas necessárias e as atualizações do cache, não o número de visitantes.

IDs confirmados pela API:

- Canal: `UCu99Ykzuw_EWYXdX68K1ong`.
- Uploads: `UUu99Ykzuw_EWYXdX68K1ong`.
- Handle: `@vsbseguranca`.
- Nome: Vsb Segurança Eletrônica e soluções técnicas.

## Contrato público

`YouTubeFeed` contém `shorts`, `fullVideos`, `recentVideos`, `videos`, `channel` e `updatedAt`. Cada vídeo contém `id`, `title`, `thumbnail`, `publishedAt`, `url` e, quando disponível, `description` limitada a 500 caracteres. URLs de vídeos são reconstruídas pelo servidor; miniaturas aceitam somente HTTPS em `i.ytimg.com`, na ordem `maxres`, `standard`, `high`, `medium`, `default`.

Chave, cabeçalhos privados, configuração de playlists, respostas brutas e erros do provedor não entram no JSON público. A resposta vazia mantém o mesmo contrato, com arrays vazios, `channel: null` e `updatedAt: null`.

## Cache e falhas

- Validade normal de **uma hora**, compartilhada pelo processo; acessos simultâneos aguardam uma única atualização.
- Persistência em `/opt/vsb-site/youtube-cache`, montado como `/app/data/youtube`. O arquivo **`videos-v2.json`** contém somente metadados públicos e a identificação da configuração. A versão anterior `videos-v1.json` permanece disponível para retorno à aplicação anterior.
- A versão do formato e a identificação dos IDs configurados são verificadas na leitura. Alterar as playlists invalida a classificação anterior, mesmo que o arquivo ainda esteja dentro da validade.
- Escrita em arquivo temporário, permissão `600` e renomeação atômica; o diretório pertence ao usuário do container (`1000:1000`).
- Em falha geral, mantém o último resultado utilizável por até **24 horas** e tenta novamente após **cinco minutos**. Sem dados utilizáveis, a interface oferece acesso ao canal.
- Uma playlist opcional incorreta ou indisponível não apaga os uploads já consultados. Essa resposta parcial tem validade de **cinco minutos**, inclusive após reinício, para que a recuperação não espere uma hora.
- Prazo máximo das consultas externas por atualização: **oito segundos**. Logs contêm somente códigos fixos de diagnóstico, nunca respostas brutas, credenciais ou mensagens de exceção do provedor.
- Após a validade, a próxima consulta atualiza o cache; não é necessário editar a home quando novos vídeos são publicados.

## Chave e configuração na VPS

`YOUTUBE_API_KEY` é lida somente no servidor. Não usar prefixo `VITE_`, argumento de build nem JavaScript público. A chamada envia a credencial no cabeçalho `X-Goog-Api-Key`, sem colocá-la na URL.

Em produção, `/root/vsb-youtube-runtime.env` tem permissão `600` e é passado ao container com `--env-file`. Ele contém também configurações existentes e deve ser editado preservando essas outras variáveis. Preencher ali as duas variáveis de playlists quando os IDs estiverem disponíveis e usar o arquivo de cache v2 nesta versão.

Depois de alterar esse arquivo, recriar o container com o mesmo arquivo de ambiente e volume de cache. Reiniciar um container existente não recarrega um arquivo `--env-file` alterado. A edição desses IDs não exige rebuild dos arquivos públicos.

A YouTube Data API v3 deve permanecer habilitada. A chave de servidor pode ser restrita a essa API e ao IP de saída da VPS, atualmente `203.0.113.10`. Se a saída passar a utilizar IPv6, incluir o IPv6 correspondente. Restrições por HTTP referrer são destinadas a chaves de navegador e não são necessárias para esta integração no servidor.

Desenvolvimento: copiar `.env.example` para `.env` ignorado pelo Git, preencher a chave somente nesse arquivo e definir `YOUTUBE_CACHE_FILE=./.cache/youtube/videos-v2.json`. Executar `bun install --frozen-lockfile` e `bun run dev`. Os testes e o build não exigem chave real.

## Interface

- Shorts usam cards 9:16 com rolagem horizontal e scroll-snap; vídeos completos usam uma composição 16:9 com destaque principal e itens secundários.
- Nenhum iframe é carregado na entrada da página. A seleção abre um único player `youtube-nocookie.com` em diálogo, sem autoplay, com fechar, Escape, retorno de foco e bloqueio da rolagem de fundo. Fechar remove o iframe.
- Cards mantêm URLs reais do YouTube; títulos são texto HTML, e miniaturas usam carregamento lazy e tratamento de erro.
- Estados de carregamento têm proporções correspondentes; estados vazios não criam vídeos fictícios. Movimentos respeitam a preferência por redução de animação.
- A CSP existente permite `youtube-nocookie.com` em `frame-src` e `i.ytimg.com` em `img-src`. A Data API não é chamada pelo navegador.
- Cabeçalho, navegação, outras seções, catálogo, rodapé e integrações Google existentes permanecem fora do escopo desta revisão.

## Arquivos e validação

- `src/components/site/YouTubeSection.tsx` e `src/styles.css`: apresentação e interação restritas à seção.
- `src/lib/youtube-types.ts`: contrato público por categorias.
- `src/lib/youtube-feed.server.ts`: consulta, paginação, classificação, validação e cache.
- `src/lib/youtube.server.ts`, `src/lib/config.server.ts` e `.env.example`: configuração privada e armazenamento.
- `tests/youtube-feed.test.ts`: testes com credenciais sintéticas e API simulada.
- `YOUTUBE.md`: operação e limites da integração.

O endpoint `src/routes/api.youtube.videos.ts` e a posição da seção em `src/routes/index.tsx` permanecem os existentes.

Os **33 testes unitários** foram aprovados localmente com Node. Eles cobrem descoberta, thumbnails, dados públicos, ausência de chave, cache, falhas, concorrência, nenhuma/uma/duas playlists, propriedade e visibilidade, precedência, deduplicação, paginação, limite de 200, lotes de 50, falhas parciais e mudança de configuração.

`bun run test:youtube` executa a mesma suíte no ambiente Docker. `bun run check:publish` valida configuração pública, ESLint e build. A verificação visual desta revisão cobre as larguras 1920, 1440, 1280, 1024, 768, 430, 390 e 375px; seus resultados e a publicação são registrados no relatório de entrega. Dados simulados de interface ficam exclusivamente no navegador de testes.

URLs de verificação: `https://vsbseguranca.com.br/#youtube` e `https://vsbseguranca.com.br/api/youtube/videos`.

## Publicação e resultado da revisão

Publicado em **16/09/2026**, na imagem `vsb-site:youtube-hub-20260916`. O código implantado está em `/opt/vsb-site/source-youtube-hub-20260916`, apontado por `/opt/vsb-site/current`; o container `vsb-site` atende o Nginx em `127.0.0.1:3008`. Os arquivos `deploy/nginx-vsb-live.conf` e `deploy/nginx-vsbseguranca.conf` acompanham a mudança de porta, mantendo a política de segurança existente.

A versão anterior foi preservada no container `vsb-site-before-youtube-hub-20260916`. Backup e script de reversão: `/root/vsb-backup-youtube-hub-20260916/rollback-site.sh`. O cache v1 e o arquivo privado de credenciais foram preservados; esta versão seleciona o cache v2 por variável do container.

Resultados registrados em `../checks-youtube-hub/`:

- **33 testes unitários** aprovados em Node e Bun; configuração pública, ESLint e build de produção concluídos.
- **227 verificações de interface**, com casos simulados de Shorts/vídeos completos, publicação sem classificação, canal vazio, falha do endpoint e miniaturas indisponíveis. Testados os oito tamanhos solicitados, carrossel, proporções, links, redução de movimento, Tab/Shift+Tab, Escape, backdrop e retorno de foco.
- Nenhuma violação nos testes axe WCAG A/AA da seção e do diálogo; nenhum erro JavaScript ou violação de CSP nos cenários verificados.
- API pública, miniatura real e documento do player oficial responderam normalmente. Nenhum iframe antes do clique, somente um durante a seleção e nenhum após fechar; sem autoplay e sem chamadas da Data API pelo navegador.
- **79 arquivos públicos e 121 arquivos do código implantado** examinados: a credencial privada não foi encontrada. O cache persistente manteve o mesmo horário de atualização após a substituição do container.
- Nove URLs de regressão responderam HTTP 200, incluindo home, catálogo, blog, contato, ads.txt, robots.txt, sitemap e páginas legais. AdSense, GA4, GTM e Reader Revenue Manager permanecem presentes.
- As primeiras 1.188 linhas de CSS, a estrutura da home e as dependências permaneceram iguais. Não houve edição no WordPress.

Nos testes de interação, somente o script de pesquisa do Reader Revenue Manager foi isolado para impedir que um diálogo externo bloqueasse os cliques do teste. Ele permanece habilitado no site publicado. Os cenários de vários vídeos usam dados sintéticos exclusivamente no navegador de testes; a validação pública usa o vídeo real do canal. Capturas da seção ocultam temporariamente os elementos fixos externos apenas durante a captura.

**Configuração ainda necessária para preencher as duas categorias:** informar `YOUTUBE_SHORTS_PLAYLIST_ID` e `YOUTUBE_VIDEOS_PLAYLIST_ID`. A publicação atual apresenta um vídeo real em **Últimas publicações** e acesso direto à aba Shorts, sem inventar uma classificação. Nenhuma playlist foi criada ou modificada no YouTube.

## Referências oficiais

- [Consulta do canal por handle](https://developers.google.com/youtube/v3/docs/channels/list).
- [Itens de playlist e quota](https://developers.google.com/youtube/v3/docs/playlistItems/list).
- [Propriedade e disponibilidade de playlists](https://developers.google.com/youtube/v3/docs/playlists/list).
- [Permissões e disponibilidade dos vídeos](https://developers.google.com/youtube/v3/docs/videos).
- [Player e parâmetros](https://developers.google.com/youtube/player_parameters).
- [Restrições de chaves por servidor ou navegador](https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys).
