import type { YouTubeFeed, YouTubeVideo } from "./youtube-types";

export const YOUTUBE_VIDEO_LIMIT = 4;
export const YOUTUBE_SHORTS_LIMIT = 8;
export const YOUTUBE_PLAYLIST_SCAN_LIMIT = 200;
export const YOUTUBE_CACHE_TTL = 3_600_000;
export const YOUTUBE_RETRY_DELAY = 300_000;
export const YOUTUBE_STALE_LIMIT = 86_400_000;
const CHANNEL_HANDLE = "@vsbseguranca";
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;
const EMPTY_FEED: YouTubeFeed = {
  videos: [],
  shorts: [],
  fullVideos: [],
  recentVideos: [],
  channel: null,
  updatedAt: null,
};

type PlaylistConfig = { shorts?: string; fullVideos?: string };
type Options = {
  fetch: typeof fetch;
  now: () => number;
  apiKey: () => string | undefined;
  playlists?: () => PlaylistConfig;
  readCache: () => Promise<unknown>;
  writeCache: (value: unknown) => Promise<void>;
  log: (code: string) => void;
};
type Cache = {
  version: 2;
  fingerprint: string;
  fetchedAt: number;
  refreshAfter: number;
  feed: YouTubeFeed;
};
type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
const text = (value: unknown) => (typeof value === "string" ? value : "");
const validId = (id: unknown) => /^[a-zA-Z0-9_-]{11}$/.test(text(id));
const validPlaylistId = (id: string) => /^[a-zA-Z0-9_-]{10,80}$/.test(id);
const newest = (videos: YouTubeVideo[]) =>
  videos.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
const fingerprint = (config: PlaylistConfig) =>
  JSON.stringify([CHANNEL_HANDLE, config.shorts || "", config.fullVideos || ""]);

function thumbnail(value: unknown) {
  const thumbnails = object(value);
  for (const size of ["maxres", "standard", "high", "medium", "default"]) {
    const url = text(object(thumbnails[size]).url);
    if (/^https:\/\/i\.ytimg\.com\//.test(url)) return url;
  }
  return "";
}

function cleanVideo(value: unknown): YouTubeVideo | null {
  const video = object(value);
  if (
    !validId(video.id) ||
    !text(video.title) ||
    !/^https:\/\/i\.ytimg\.com\//.test(text(video.thumbnail)) ||
    !Number.isFinite(Date.parse(text(video.publishedAt)))
  )
    return null;
  const id = text(video.id);
  const description = text(video.description).slice(0, 500);
  return {
    id,
    title: text(video.title).slice(0, 500),
    thumbnail: text(video.thumbnail),
    publishedAt: text(video.publishedAt),
    url: `https://www.youtube.com/watch?v=${id}`,
    ...(description ? { description } : {}),
  };
}

function cachedFeed(value: unknown, expectedFingerprint: string): Cache | null {
  const cache = object(value);
  const feed = object(cache.feed);
  const channel = object(feed.channel);
  if (
    cache.version !== 2 ||
    cache.fingerprint !== expectedFingerprint ||
    typeof cache.fetchedAt !== "number" ||
    !Number.isFinite(cache.fetchedAt) ||
    typeof cache.refreshAfter !== "number" ||
    !Number.isFinite(cache.refreshAfter) ||
    cache.refreshAfter < cache.fetchedAt ||
    cache.refreshAfter > cache.fetchedAt + YOUTUBE_CACHE_TTL ||
    !/^UC[a-zA-Z0-9_-]{22}$/.test(text(channel.id)) ||
    !text(channel.title) ||
    !Number.isFinite(Date.parse(text(feed.updatedAt)))
  )
    return null;
  const groups: Pick<YouTubeFeed, "shorts" | "fullVideos" | "recentVideos"> = {
    shorts: [],
    fullVideos: [],
    recentVideos: [],
  };
  const seen = new Set<string>();
  for (const group of ["shorts", "fullVideos", "recentVideos"] as const) {
    if (!Array.isArray(feed[group])) return null;
    for (const entry of feed[group]) {
      const video = cleanVideo(entry);
      if (!video) return null;
      if (!seen.has(video.id)) groups[group].push(video);
      seen.add(video.id);
    }
    groups[group] = newest(groups[group]).slice(
      0,
      group === "shorts" ? YOUTUBE_SHORTS_LIMIT : YOUTUBE_VIDEO_LIMIT,
    );
  }
  return {
    version: 2,
    fingerprint: expectedFingerprint,
    fetchedAt: cache.fetchedAt,
    refreshAfter: cache.refreshAfter,
    feed: {
      ...groups,
      videos: newest([...groups.shorts, ...groups.fullVideos, ...groups.recentVideos]).slice(
        0,
        YOUTUBE_VIDEO_LIMIT,
      ),
      channel: { id: text(channel.id), title: text(channel.title).slice(0, 200), url: CHANNEL_URL },
      updatedAt: text(feed.updatedAt),
    },
  };
}

class FeedError extends Error {}

/** Explicit playlist membership is the only source of format classification. */
export function createYouTubeFeed(options: Options) {
  let cache: Cache | null = null;
  let hydration: Promise<void> | null = null;
  let inFlight: Promise<YouTubeFeed> | null = null;
  let activeFingerprint: string | null = null;
  let retryAt = 0;
  const lastAvailable = () =>
    cache && options.now() - cache.fetchedAt <= YOUTUBE_STALE_LIMIT ? cache.feed : EMPTY_FEED;

  async function hydrate(expectedFingerprint: string) {
    try {
      const stored = cachedFeed(await options.readCache(), expectedFingerprint);
      if (stored && stored.fetchedAt <= options.now()) cache = stored;
    } catch {
      options.log("CACHE_READ_FAILED");
    }
  }

  async function refresh(config: PlaylistConfig): Promise<YouTubeFeed> {
    retryAt = options.now() + YOUTUBE_RETRY_DELAY;
    const apiKey = options.apiKey()?.trim();
    if (!apiKey) {
      options.log("API_KEY_NOT_CONFIGURED");
      return lastAvailable();
    }
    const signal = AbortSignal.timeout(8_000);
    const requestPage = async (resource: string, params: Record<string, string>) => {
      const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
      url.search = new URLSearchParams(params).toString();
      const response = await options.fetch(url, {
        headers: { Accept: "application/json", "X-Goog-Api-Key": apiKey },
        signal,
      });
      if (!response.ok) throw new FeedError(`API_HTTP_${response.status}`);
      const data = object(await response.json());
      if (!Array.isArray(data.items)) throw new FeedError("INVALID_API_RESPONSE");
      return { items: data.items.map(object), nextPageToken: text(data.nextPageToken) };
    };
    const request = async (resource: string, params: Record<string, string>) =>
      (await requestPage(resource, params)).items;
    try {
      const channels = await request("channels", {
        part: "snippet,contentDetails",
        forHandle: CHANNEL_HANDLE,
      });
      const channel = channels[0];
      if (channels.length !== 1 || !channel || !/^UC[a-zA-Z0-9_-]{22}$/.test(text(channel.id)))
        throw new FeedError("CHANNEL_NOT_FOUND");
      const channelId = text(channel.id);
      const channelSnippet = object(channel.snippet);
      const uploads = text(object(object(channel.contentDetails).relatedPlaylists).uploads);
      if (!validPlaylistId(uploads)) throw new FeedError("UPLOADS_NOT_FOUND");
      const loadIds = async (playlistId: string, limit: number) => {
        const ids = new Set<string>();
        let pageToken = "";
        const tokens = new Set<string>();
        for (let scanned = 0; scanned < limit; scanned += 50) {
          const page = await requestPage("playlistItems", {
            part: "snippet,contentDetails",
            playlistId,
            maxResults: String(Math.min(50, limit - scanned)),
            ...(pageToken ? { pageToken } : {}),
          });
          for (const item of page.items.slice(0, Math.min(50, limit - scanned))) {
            const id = text(object(item.contentDetails).videoId);
            if (validId(id)) ids.add(id);
          }
          if (!page.nextPageToken || tokens.has(page.nextPageToken)) break;
          tokens.add(page.nextPageToken);
          pageToken = page.nextPageToken;
        }
        return [...ids];
      };
      // Uploads always remain available, independently of optional playlist configuration.
      const uploadIds = await loadIds(uploads, 12);
      const resources: JsonObject[] = uploadIds.length
        ? await request("videos", { part: "snippet,status", id: uploadIds.join(",") })
        : [];
      const configured = [
        ...new Set([config.shorts, config.fullVideos].filter((id): id is string => Boolean(id))),
      ];
      const candidates = configured.filter((id) => validPlaylistId(id) && id !== uploads);
      let partial = candidates.length !== configured.length;
      if (partial) options.log("PLAYLIST_CONFIG_INVALID");
      const membership = new Map<string, string[]>();
      if (candidates.length) {
        try {
          const playlists = await request("playlists", {
            part: "snippet,status",
            id: candidates.join(","),
          });
          await Promise.all(
            candidates.map(async (id) => {
              const playlist = playlists.find((item) => item.id === id);
              if (
                !playlist ||
                object(playlist.snippet).channelId !== channelId ||
                object(playlist.status).privacyStatus !== "public"
              ) {
                partial = true;
                options.log("PLAYLIST_NOT_PUBLIC_OR_OWNED");
                return;
              }
              try {
                membership.set(id, await loadIds(id, YOUTUBE_PLAYLIST_SCAN_LIMIT));
              } catch {
                partial = true;
                options.log("PLAYLIST_ITEMS_FAILED");
              }
            }),
          );
        } catch {
          partial = true;
          options.log("PLAYLIST_LOOKUP_FAILED");
        }
      }
      const shortIds = new Set(membership.get(config.shorts || "") || []);
      const fullIds = new Set(membership.get(config.fullVideos || "") || []);
      const ids = [...new Set([...shortIds, ...fullIds, ...uploadIds])];
      const requested = new Set(ids);
      const uploadSet = new Set(uploadIds);
      const extraIds = ids.filter((id) => !uploadSet.has(id));
      // Optional playlist failures cannot discard uploads already validated above.
      const batches = Array.from({ length: Math.ceil(extraIds.length / 50) }, (_, index) =>
        extraIds.slice(index * 50, (index + 1) * 50),
      );
      await Promise.all(
        batches.map(async (batch) => {
          try {
            resources.push(
              ...(await request("videos", { part: "snippet,status", id: batch.join(",") })),
            );
          } catch {
            partial = true;
            options.log("PLAYLIST_VIDEO_DETAILS_FAILED");
          }
        }),
      );
      const videos = new Map<string, YouTubeVideo>();
      for (const video of resources) {
        const id = text(video.id);
        const snippet = object(video.snippet);
        const status = object(video.status);
        if (
          !requested.has(id) ||
          snippet.channelId !== channelId ||
          status.privacyStatus !== "public" ||
          status.embeddable !== true
        )
          continue;
        const cleaned = cleanVideo({
          id,
          title: snippet.title,
          description: snippet.description,
          publishedAt: snippet.publishedAt,
          thumbnail: thumbnail(snippet.thumbnails),
        });
        if (cleaned) videos.set(id, cleaned);
      }
      const ordered = newest([...videos.values()]);
      const shorts = ordered
        .filter((video) => shortIds.has(video.id))
        .slice(0, YOUTUBE_SHORTS_LIMIT);
      const fullVideos = ordered
        .filter((video) => fullIds.has(video.id) && !shortIds.has(video.id))
        .slice(0, YOUTUBE_VIDEO_LIMIT);
      const recentVideos = ordered
        .filter(
          (video) => uploadSet.has(video.id) && !shortIds.has(video.id) && !fullIds.has(video.id),
        )
        .slice(0, YOUTUBE_VIDEO_LIMIT);
      const fetchedAt = options.now();
      const feed: YouTubeFeed = {
        channel: {
          id: channelId,
          title: text(channelSnippet.title).slice(0, 200),
          url: CHANNEL_URL,
        },
        updatedAt: new Date(fetchedAt).toISOString(),
        videos: newest([...shorts, ...fullVideos, ...recentVideos]).slice(0, YOUTUBE_VIDEO_LIMIT),
        shorts,
        fullVideos,
        recentVideos,
      };
      cache = {
        version: 2,
        fingerprint: fingerprint(config),
        fetchedAt,
        refreshAfter: fetchedAt + (partial ? YOUTUBE_RETRY_DELAY : YOUTUBE_CACHE_TTL),
        feed,
      };
      retryAt = 0;
      try {
        await options.writeCache(cache);
      } catch {
        options.log("CACHE_WRITE_FAILED");
      }
      return feed;
    } catch (error) {
      // Provider bodies, headers and raw exception messages never enter logs or visitor JSON.
      options.log(error instanceof FeedError ? error.message : "API_REQUEST_FAILED");
      return lastAvailable();
    }
  }

  return {
    async getVideos(): Promise<YouTubeFeed> {
      const values = options.playlists?.() || {};
      const config = {
        shorts: values.shorts?.trim() || "",
        fullVideos: values.fullVideos?.trim() || "",
      };
      const currentFingerprint = fingerprint(config);
      if (activeFingerprint !== currentFingerprint) {
        if (inFlight) await inFlight;
        activeFingerprint = currentFingerprint;
        cache = null;
        hydration = null;
        retryAt = 0;
      }
      hydration ??= hydrate(currentFingerprint);
      await hydration;
      if (cache && options.now() < cache.refreshAfter) return cache.feed;
      if (inFlight) return inFlight;
      if (options.now() < retryAt) return lastAvailable();
      inFlight = refresh(config);
      try {
        return await inFlight;
      } finally {
        inFlight = null;
      }
    },
  };
}
