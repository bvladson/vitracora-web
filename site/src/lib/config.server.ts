import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Segredo compartilhado com o mu-plugin do WordPress que recebe os leads
    // do formulário de orçamento. Precisa bater com VSB_LEADS_TOKEN no
    // compose.yml do CMS. Nunca use prefixo VITE_ aqui: iria para o browser.
    leadsToken: process.env.VSB_LEADS_TOKEN,
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    youtubeShortsPlaylistId: process.env.YOUTUBE_SHORTS_PLAYLIST_ID,
    youtubeVideosPlaylistId: process.env.YOUTUBE_VIDEOS_PLAYLIST_ID,
    // Add server-only values here, e.g.:
    //   databaseUrl: process.env.DATABASE_URL,
    //   stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  };
}
