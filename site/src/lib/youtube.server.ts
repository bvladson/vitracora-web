import "@tanstack/react-start/server-only";
import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import { getServerConfig } from "./config.server";
import { createYouTubeFeed } from "./youtube-feed.server";

const cachePath = () => process.env.YOUTUBE_CACHE_FILE || "/app/data/youtube/videos-v2.json";
const youtube = createYouTubeFeed({
  fetch: globalThis.fetch,
  now: Date.now,
  apiKey: () => getServerConfig().youtubeApiKey,
  playlists: () => {
    const config = getServerConfig();
    return { shorts: config.youtubeShortsPlaylistId, fullVideos: config.youtubeVideosPlaylistId };
  },
  readCache: async () => {
    try {
      return JSON.parse(await readFile(cachePath(), "utf8"));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT")
        return null;
      throw error;
    }
  },
  writeCache: async (value) => {
    const path = cachePath();
    await mkdir(dirname(path), { recursive: true });
    const temporaryPath = `${path}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(value), { mode: 0o600 });
    await rename(temporaryPath, path);
  },
  log: (code) => console.warn(`[youtube] ${code}`),
});

export const getYouTubeVideos = () => youtube.getVideos();
