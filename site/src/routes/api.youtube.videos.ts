import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { getYouTubeVideos } from "@/lib/youtube.server";

export const Route = createFileRoute("/api/youtube/videos")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(await getYouTubeVideos(), {
          headers: {
            // Freshness and quota control live in the server cache, not per-browser caches.
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        }),
    },
  },
});
