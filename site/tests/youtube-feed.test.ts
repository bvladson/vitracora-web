import assert from "node:assert/strict";
import test from "node:test";
import { createYouTubeFeed } from "../src/lib/youtube-feed.server.ts";

const NOW = Date.parse("2026-09-15T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;
const RETRY = 5 * 60 * 1000;
const CHANNEL_ID = `UC${"a".repeat(22)}`;
// Deliberately unrelated to the channel ID: discovery must use the API field.
const UPLOADS_ID = `UU${"z".repeat(22)}`;
const TEST_KEY = "synthetic-test-key-not-a-google-credential";
const SHORTS_ID = "PLshorts123456789";
const FULL_ID = "PLfull12345678901";

function video(
  number: number,
  overrides: {
    channelId?: string;
    privacyStatus?: string;
    embeddable?: boolean;
    publishedAt?: string;
    thumbnails?: Record<string, { url: string }>;
    title?: string;
    description?: string;
  } = {},
) {
  const id = `video${String(number).padStart(6, "0")}`;
  return {
    id,
    snippet: {
      channelId: overrides.channelId ?? CHANNEL_ID,
      title: overrides.title ?? `Vídeo técnico ${number}`,
      description: overrides.description ?? "",
      publishedAt: overrides.publishedAt ?? `2026-09-${String(number).padStart(2, "0")}T10:00:00Z`,
      thumbnails: overrides.thumbnails ?? {
        default: { url: `https://i.ytimg.com/vi/${id}/default.jpg` },
        high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` },
        maxres: { url: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` },
      },
    },
    status: {
      privacyStatus: overrides.privacyStatus ?? "public",
      embeddable: overrides.embeddable ?? true,
      uploadStatus: "processed",
    },
  };
}

type ApiVideo = ReturnType<typeof video>;

function harness(
  options: {
    videos?: ApiVideo[];
    playlistVideos?: ApiVideo[];
    cached?: unknown;
    key?: string | null;
    now?: number;
    readError?: boolean;
    writeError?: boolean;
    failure?: "network" | "quota" | "empty-channel" | "invalid-json";
    playlists?: { shorts?: string; fullVideos?: string };
    playlistEntries?: Record<string, ApiVideo[]>;
    playlistOwner?: string;
    playlistPrivacy?: string;
    missingPlaylist?: boolean;
    optionalFailure?: "lookup" | "items" | "details";
  } = {},
) {
  const state = {
    now: options.now ?? NOW,
    videos: options.videos ?? [video(1), video(4), video(2), video(3)],
    failure: options.failure,
    cached: options.cached,
    reads: 0,
    writes: [] as unknown[],
    calls: [] as URL[],
    logs: [] as string[],
    playlists: options.playlists ?? {},
    optionalFailure: options.optionalFailure,
  };
  const fetchMock: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    state.calls.push(url);
    assert.equal(url.searchParams.has("key"), false, "API key never enters query strings");
    assert.equal(new Headers(init?.headers).get("X-Goog-Api-Key"), options.key ?? TEST_KEY);
    if (state.failure === "network") {
      // A transport error could contain a URL. It must never reach visitor JSON
      // or logs verbatim, because a URL may contain the credential.
      throw new Error(`Request failed: ${url.href}&secret=${TEST_KEY}`);
    }
    if (state.failure === "quota") {
      return Response.json(
        { error: { message: TEST_KEY, errors: [{ reason: "quotaExceeded" }] } },
        { status: 403 },
      );
    }
    if (state.failure === "invalid-json") {
      return new Response("not-json", { status: 200 });
    }
    if (url.pathname.endsWith("/channels")) {
      return Response.json({
        items:
          state.failure === "empty-channel"
            ? []
            : [
                {
                  id: CHANNEL_ID,
                  snippet: { title: "Canal de teste" },
                  contentDetails: {
                    relatedPlaylists: { uploads: UPLOADS_ID },
                  },
                },
              ],
      });
    }
    if (url.pathname.endsWith("/playlists")) {
      if (state.optionalFailure === "lookup") return Response.json({}, { status: 403 });
      return Response.json({
        items: options.missingPlaylist
          ? []
          : (url.searchParams.get("id") || "").split(",").map((id) => ({
              id,
              snippet: { channelId: options.playlistOwner ?? CHANNEL_ID },
              status: { privacyStatus: options.playlistPrivacy ?? "public" },
            })),
      });
    }
    if (url.pathname.endsWith("/playlistItems")) {
      const playlistId = url.searchParams.get("playlistId") || "";
      if (state.optionalFailure === "items" && playlistId !== UPLOADS_ID)
        return Response.json({}, { status: 503 });
      const entries =
        playlistId === UPLOADS_ID
          ? (options.playlistVideos ?? state.videos)
          : (options.playlistEntries?.[playlistId] ?? []);
      const offset = Number(url.searchParams.get("pageToken") || 0);
      const size = Number(url.searchParams.get("maxResults") || 50);
      const next = offset + size;
      return Response.json({
        ...(next < entries.length ? { nextPageToken: String(next) } : {}),
        items: entries.slice(offset, next).map((item) => ({
          snippet: {
            ...item.snippet,
            // Playlist insertion time is not the actual publication time.
            publishedAt: "2026-09-15T00:00:00Z",
            resourceId: { kind: "youtube#video", videoId: item.id },
          },
          contentDetails: {
            videoId: item.id,
            videoPublishedAt: item.snippet.publishedAt,
          },
        })),
      });
    }
    if (url.pathname.endsWith("/videos")) {
      if (
        state.optionalFailure === "details" &&
        state.calls.filter((call) => call.pathname.endsWith("/videos")).length > 1
      )
        return Response.json({}, { status: 503 });
      const ids = new Set((url.searchParams.get("id") || "").split(","));
      assert.ok(ids.size <= 50, "videos.list batches remain within the API limit");
      return Response.json({ items: state.videos.filter((item) => ids.has(item.id)) });
    }
    throw new Error(`Unexpected endpoint ${url.pathname}`);
  };

  const service = createYouTubeFeed({
    fetch: fetchMock,
    now: () => state.now,
    apiKey: () => (options.key === null ? undefined : (options.key ?? TEST_KEY)),
    playlists: () => state.playlists,
    readCache: async () => {
      state.reads += 1;
      if (options.readError) throw new Error("Unreadable cache");
      return state.cached;
    },
    writeCache: async (value) => {
      if (options.writeError) throw new Error("Read-only cache directory");
      state.writes.push(structuredClone(value));
      state.cached = structuredClone(value);
    },
    log: (code) => state.logs.push(code),
  });

  return { ...service, state };
}

async function validCache(age = 0) {
  const initial = harness();
  const feed = await initial.getVideos();
  return {
    ...(initial.state.writes[0] as Record<string, unknown>),
    fetchedAt: NOW - age,
    refreshAfter: NOW - age + HOUR,
    feed,
  };
}

test("discovers the handle and uses the returned uploads playlist ID", async () => {
  const { getVideos, state } = harness();
  const feed = await getVideos();
  const discovery = state.calls.find((url) => url.pathname.endsWith("/channels"));
  const uploads = state.calls.find((url) => url.pathname.endsWith("/playlistItems"));

  assert.ok(discovery);
  assert.equal(discovery.searchParams.get("forHandle"), "@vsbseguranca");
  assert.ok(discovery.searchParams.get("part")?.includes("contentDetails"));
  assert.ok(uploads);
  assert.equal(uploads.searchParams.get("playlistId"), UPLOADS_ID);
  assert.ok(Number(uploads.searchParams.get("maxResults")) >= 4);
  assert.ok(uploads.searchParams.get("part")?.includes("snippet"));
  assert.ok(uploads.searchParams.get("part")?.includes("contentDetails"));
  assert.equal(feed.channel?.id, CHANNEL_ID);
  assert.equal(feed.channel?.title, "Canal de teste");
  assert.equal(state.writes.length, 1);
  assert.equal(JSON.stringify(feed).includes(TEST_KEY), false);
});

test("returns the latest four publications in descending order and clean fields", async () => {
  const { getVideos } = harness({
    videos: [video(1), video(3), video(5), video(2), video(4)],
  });
  const feed = await getVideos();

  assert.deepEqual(
    feed.videos.map((item) => item.id),
    [5, 4, 3, 2].map((number) => video(number).id),
  );
  const latest = feed.videos[0];
  assert.equal(latest.title, "Vídeo técnico 5");
  assert.equal(Date.parse(latest.publishedAt), Date.parse(video(5).snippet.publishedAt));
  assert.equal(latest.thumbnail, "https://i.ytimg.com/vi/video000005/maxresdefault.jpg");
  assert.equal(latest.url, "https://www.youtube.com/watch?v=video000005");
  assert.deepEqual(Object.keys(latest).sort(), ["id", "publishedAt", "thumbnail", "title", "url"]);
  assert.equal(Date.parse(feed.updatedAt ?? ""), NOW);
});

test("uses the best thumbnail actually available, including default only", async () => {
  for (const quality of ["maxres", "standard", "high", "medium", "default"]) {
    const thumbnail = `https://i.ytimg.com/vi/video000001/${quality}.jpg`;
    const { getVideos } = harness({
      videos: [video(1, { thumbnails: { [quality]: { url: thumbnail } } })],
    });
    const feed = await getVideos();
    assert.equal(feed.videos[0]?.thumbnail, thumbnail, quality);
  }
});

test("filters private, unlisted, non-embeddable and foreign-channel videos", async () => {
  const { getVideos } = harness({
    videos: [
      video(1),
      video(2, { privacyStatus: "private" }),
      video(3, { privacyStatus: "unlisted" }),
      video(4, { embeddable: false }),
      video(5, { channelId: `UC${"b".repeat(22)}` }),
    ],
  });
  const feed = await getVideos();
  assert.deepEqual(
    feed.videos.map((item) => item.id),
    [video(1).id],
  );
});

test("ignores deleted entries omitted by videos.list and unexpected returned IDs", async () => {
  const { getVideos } = harness({
    playlistVideos: [video(1), video(2)],
    videos: [video(1), video(3)],
  });
  const feed = await getVideos();
  assert.deepEqual(
    feed.videos.map((item) => item.id),
    [video(1).id],
  );
});

test("supports one video and an empty successful channel without inventing cards", async () => {
  const single = harness({ videos: [video(1)] });
  const empty = harness({ videos: [] });
  assert.equal((await single.getVideos()).videos.length, 1);
  const feed = await empty.getVideos();
  assert.deepEqual(feed.videos, []);
  assert.equal(feed.channel?.id, CHANNEL_ID);
  assert.equal(empty.state.writes.length, 1);
  assert.equal(
    empty.state.calls.some((url) => url.pathname.endsWith("/videos")),
    false,
    "An empty playlist does not require a videos.list request",
  );
});

test("a valid disk cache is reused without any upstream calls", async () => {
  const cached = await validCache(HOUR - 1);
  const { getVideos, state } = harness({ cached });
  assert.deepEqual(await getVideos(), cached.feed);
  assert.deepEqual(await getVideos(), cached.feed);
  assert.equal(state.calls.length, 0);
  assert.equal(state.writes.length, 0);
});

test("an expired cache refreshes and exposes newly published videos", async () => {
  const { getVideos, state } = harness({
    cached: await validCache(HOUR + 1),
    videos: [video(6), video(5), video(4), video(3)],
  });
  const feed = await getVideos();
  assert.equal(feed.videos[0]?.id, video(6).id);
  assert.ok(state.calls.some((url) => url.pathname.endsWith("/playlistItems")));
  assert.equal(state.writes.length, 1);
  const callsAfterRefresh = state.calls.length;
  state.now += HOUR - 1;
  assert.deepEqual(await getVideos(), feed);
  assert.equal(state.calls.length, callsAfterRefresh);
});

test("simultaneous visitors share one refresh", async () => {
  const { getVideos, state } = harness();
  const feeds = await Promise.all(Array.from({ length: 12 }, () => getVideos()));
  assert.ok(feeds.every((feed) => JSON.stringify(feed) === JSON.stringify(feeds[0])));
  for (const endpoint of ["channels", "playlistItems", "videos"]) {
    assert.equal(
      state.calls.filter((url) => url.pathname.endsWith(`/${endpoint}`)).length,
      1,
      `${endpoint} must be fetched once`,
    );
  }
  assert.equal(state.writes.length, 1);
});

test("an API outage uses recent stale data and backs off before retrying", async () => {
  const cached = await validCache(2 * HOUR);
  const { getVideos, state } = harness({ cached, failure: "quota" });
  assert.deepEqual(await getVideos(), cached.feed);
  const callsAfterFailure = state.calls.length;
  assert.ok(callsAfterFailure > 0);
  state.now += RETRY - 1;
  assert.deepEqual(await getVideos(), cached.feed);
  assert.equal(state.calls.length, callsAfterFailure);
  state.now += 2;
  state.failure = undefined;
  state.videos = [video(7)];
  assert.equal((await getVideos()).videos[0]?.id, video(7).id);
  assert.ok(state.calls.length > callsAfterFailure);
  assert.equal(JSON.stringify(state.logs).includes(TEST_KEY), false);
});

test("stale data older than 24 hours is not displayed during an outage", async () => {
  const { getVideos } = harness({
    cached: await validCache(24 * HOUR + 1),
    failure: "network",
  });
  const feed = await getVideos();
  assert.deepEqual(feed.videos, []);
  assert.equal(feed.updatedAt, null);
});

test("malformed and unreadable caches do not prevent a fresh successful response", async () => {
  const cases = [
    { cached: "not-an-object" },
    { cached: { version: 1, fetchedAt: NOW, feed: { videos: "invalid" } } },
    { cached: { version: 999, fetchedAt: NOW, feed: (await validCache()).feed } },
    { readError: true },
  ];
  for (const options of cases) {
    const { getVideos, state } = harness(options);
    assert.equal((await getVideos()).videos.length, 4);
    assert.ok(state.calls.length > 0);
  }
});

test("a disk write failure does not discard fresh data or its in-memory cache", async () => {
  const { getVideos, state } = harness({ writeError: true });
  const first = await getVideos();
  assert.equal(first.videos.length, 4);
  const calls = state.calls.length;
  assert.deepEqual(await getVideos(), first);
  assert.equal(state.calls.length, calls);
});

test("missing credentials return a safe fallback without making API calls", async () => {
  const { getVideos, state } = harness({ key: null });
  const feed = await getVideos();
  assert.deepEqual(feed.videos, []);
  assert.equal(feed.updatedAt, null);
  assert.equal(state.calls.length, 0);
  assert.equal(JSON.stringify({ feed, logs: state.logs }).includes(TEST_KEY), false);
});

test("a missing credential still permits a valid existing cache", async () => {
  const cached = await validCache(HOUR - 1);
  const { getVideos, state } = harness({ cached, key: null });
  assert.deepEqual(await getVideos(), cached.feed);
  assert.equal(state.calls.length, 0);
});

test("API failures never throw or expose raw upstream errors or credentials", async () => {
  for (const failure of ["network", "quota", "empty-channel", "invalid-json"] as const) {
    const { getVideos, state } = harness({ failure });
    const feed = await getVideos();
    assert.deepEqual(feed.videos, [], failure);
    assert.equal(feed.updatedAt, null, failure);
    const serialized = JSON.stringify({ feed, logs: state.logs });
    assert.equal(serialized.includes(TEST_KEY), false, failure);
    assert.equal(serialized.includes("https://www.googleapis.com"), false, failure);
    assert.equal(state.writes.length, 0, failure);
  }
});

test("without explicit playlists every upload remains unclassified even with a Shorts hashtag", async () => {
  const { getVideos, state } = harness({ videos: [video(1, { title: "Diagnóstico #Shorts" })] });
  const feed = await getVideos();
  assert.deepEqual(feed.shorts, []);
  assert.deepEqual(feed.fullVideos, []);
  assert.deepEqual(
    feed.recentVideos.map((item) => item.id),
    [video(1).id],
  );
  assert.equal(
    state.calls.some(
      (url) => url.pathname.endsWith("/playlists") || url.pathname.endsWith("/search"),
    ),
    false,
  );
});

test("a single configured playlist classifies only its own public members", async () => {
  for (const group of ["shorts", "fullVideos"] as const) {
    const id = group === "shorts" ? SHORTS_ID : FULL_ID;
    const { getVideos, state } = harness({
      videos: [video(1), video(2), video(3)],
      playlists: { [group]: id },
      playlistEntries: { [id]: [video(2)] },
    });
    const feed = await getVideos();
    assert.deepEqual(
      feed[group].map((item) => item.id),
      [video(2).id],
    );
    assert.deepEqual(feed[group === "shorts" ? "fullVideos" : "shorts"], []);
    assert.deepEqual(
      feed.recentVideos.map((item) => item.id),
      [video(3).id, video(1).id],
    );
    assert.equal(state.calls.filter((url) => url.pathname.endsWith("/playlists")).length, 1);
  }
});

test("both playlists are disjoint, duplicates are removed, and Shorts take precedence", async () => {
  const { getVideos } = harness({
    videos: [video(1), video(2), video(2), video(3), video(4)],
    playlists: { shorts: SHORTS_ID, fullVideos: FULL_ID },
    playlistEntries: {
      [SHORTS_ID]: [video(2), video(2), video(3)],
      [FULL_ID]: [video(3), video(4), video(4)],
    },
  });
  const feed = await getVideos();
  assert.deepEqual(
    feed.shorts.map((item) => item.id),
    [video(3).id, video(2).id],
  );
  assert.deepEqual(
    feed.fullVideos.map((item) => item.id),
    [video(4).id],
  );
  assert.deepEqual(
    feed.recentVideos.map((item) => item.id),
    [video(1).id],
  );
  assert.equal(
    new Set([...feed.shorts, ...feed.fullVideos, ...feed.recentVideos].map((item) => item.id)).size,
    4,
  );
  assert.deepEqual(
    feed.videos.map((item) => item.id),
    [4, 3, 2, 1].map((number) => video(number).id),
  );
});

test("the same configured playlist is fetched once and belongs to Shorts only", async () => {
  const { getVideos, state } = harness({
    videos: [video(1)],
    playlists: { shorts: SHORTS_ID, fullVideos: SHORTS_ID },
    playlistEntries: { [SHORTS_ID]: [video(1)] },
  });
  const feed = await getVideos();
  assert.equal(feed.shorts.length, 1);
  assert.deepEqual(feed.fullVideos, []);
  assert.equal(
    state.calls.filter(
      (url) =>
        url.pathname.endsWith("/playlistItems") && url.searchParams.get("playlistId") === SHORTS_ID,
    ).length,
    1,
  );
});

test("missing, private or foreign-owned playlists never classify uploads", async () => {
  for (const extra of [
    { missingPlaylist: true },
    { playlistOwner: `UC${"b".repeat(22)}` },
    { playlistPrivacy: "private" },
    { playlistPrivacy: "unlisted" },
  ]) {
    const { getVideos, state } = harness({
      ...extra,
      videos: [video(1)],
      playlists: { shorts: SHORTS_ID },
      playlistEntries: { [SHORTS_ID]: [video(1)] },
    });
    const feed = await getVideos();
    assert.deepEqual(feed.shorts, []);
    assert.equal(feed.recentVideos.length, 1);
    assert.equal(
      state.calls.some((url) => url.searchParams.get("playlistId") === SHORTS_ID),
      false,
    );
    assert.ok(state.logs.includes("PLAYLIST_NOT_PUBLIC_OR_OWNED"));
  }
});

test("invalid IDs and the uploads playlist cannot be used as a format classifier", async () => {
  for (const id of ["bad?id=123", UPLOADS_ID]) {
    const { getVideos, state } = harness({ videos: [video(1)], playlists: { shorts: id } });
    const feed = await getVideos();
    assert.deepEqual(feed.shorts, []);
    assert.equal(feed.recentVideos.length, 1);
    assert.equal(
      state.calls.some((url) => url.pathname.endsWith("/playlists")),
      false,
    );
    assert.ok(state.logs.includes("PLAYLIST_CONFIG_INVALID"));
  }
});

test("optional lookup and item failures keep uploads and retry after five minutes", async () => {
  for (const failure of ["lookup", "items"] as const) {
    const { getVideos, state } = harness({
      videos: [video(1)],
      playlists: { shorts: SHORTS_ID },
      playlistEntries: { [SHORTS_ID]: [video(1)] },
      optionalFailure: failure,
    });
    const feed = await getVideos();
    assert.deepEqual(feed.shorts, []);
    assert.equal(feed.recentVideos.length, 1);
    const calls = state.calls.length;
    state.now += RETRY - 1;
    assert.deepEqual(await getVideos(), feed);
    assert.equal(state.calls.length, calls);
    state.now += 2;
    state.optionalFailure = undefined;
    const recovered = await getVideos();
    assert.equal(recovered.shorts.length, 1);
    assert.deepEqual(recovered.recentVideos, []);
    assert.ok(state.calls.length > calls);
  }
});

test("failure retrieving optional video details does not discard validated uploads", async () => {
  const { getVideos, state } = harness({
    videos: [video(1), video(2)],
    playlistVideos: [video(1)],
    playlists: { shorts: SHORTS_ID },
    playlistEntries: { [SHORTS_ID]: [video(2)] },
    optionalFailure: "details",
  });
  const feed = await getVideos();
  assert.deepEqual(feed.shorts, []);
  assert.deepEqual(
    feed.recentVideos.map((item) => item.id),
    [video(1).id],
  );
  assert.ok(state.logs.includes("PLAYLIST_VIDEO_DETAILS_FAILED"));
  assert.equal((state.writes[0] as { refreshAfter: number }).refreshAfter, NOW + RETRY);
});

test("public and embeddable channel checks also apply to specific playlist videos", async () => {
  const entries = [
    video(1),
    video(2, { privacyStatus: "private" }),
    video(3, { privacyStatus: "unlisted" }),
    video(4, { embeddable: false }),
    video(5, { channelId: `UC${"b".repeat(22)}` }),
  ];
  const { getVideos } = harness({
    videos: entries,
    playlistVideos: [],
    playlists: { fullVideos: FULL_ID },
    playlistEntries: { [FULL_ID]: entries },
  });
  const feed = await getVideos();
  assert.deepEqual(
    feed.fullVideos.map((item) => item.id),
    [video(1).id],
  );
  assert.deepEqual(feed.recentVideos, []);
});

test("playlist pagination finds recently published videos appended beyond the first page", async () => {
  const entries = Array.from({ length: 70 }, (_, index) =>
    video(index + 1, {
      publishedAt: new Date(NOW - (70 - index) * HOUR).toISOString(),
    }),
  );
  const { getVideos, state } = harness({
    videos: entries,
    playlistVideos: [],
    playlists: { shorts: SHORTS_ID },
    playlistEntries: { [SHORTS_ID]: entries },
  });
  const feed = await getVideos();
  assert.equal(feed.shorts.length, 8);
  assert.equal(feed.shorts[0].id, entries[69].id);
  assert.equal(
    state.calls.filter(
      (url) =>
        url.pathname.endsWith("/playlistItems") && url.searchParams.get("playlistId") === SHORTS_ID,
    ).length,
    2,
  );
  assert.equal(state.calls.filter((url) => url.pathname.endsWith("/videos")).length, 2);
  assert.equal(
    state.calls.some((url) => url.pathname.endsWith("/search")),
    false,
  );
});

test("playlist scanning is bounded at 200 entries and details use batches of at most 50", async () => {
  const entries = Array.from({ length: 260 }, (_, index) =>
    video(index + 1, {
      publishedAt: new Date(NOW - (260 - index) * HOUR).toISOString(),
    }),
  );
  const { getVideos, state } = harness({
    videos: entries,
    playlistVideos: [],
    playlists: { fullVideos: FULL_ID },
    playlistEntries: { [FULL_ID]: entries },
  });
  const feed = await getVideos();
  assert.equal(feed.fullVideos.length, 4);
  assert.equal(feed.fullVideos[0].id, entries[199].id);
  assert.equal(
    state.calls.filter(
      (url) =>
        url.pathname.endsWith("/playlistItems") && url.searchParams.get("playlistId") === FULL_ID,
    ).length,
    4,
  );
  assert.equal(state.calls.filter((url) => url.pathname.endsWith("/videos")).length, 4);
});

test("the category limits remain eight Shorts, four complete videos and four recent uploads", async () => {
  const entries = Array.from({ length: 24 }, (_, index) => video(index + 1));
  const { getVideos } = harness({
    videos: entries,
    playlistVideos: entries.slice(18),
    playlists: { shorts: SHORTS_ID, fullVideos: FULL_ID },
    playlistEntries: { [SHORTS_ID]: entries.slice(0, 12), [FULL_ID]: entries.slice(12, 18) },
  });
  const feed = await getVideos();
  assert.equal(feed.shorts.length, 8);
  assert.equal(feed.fullVideos.length, 4);
  assert.equal(feed.recentVideos.length, 4);
  assert.equal(feed.videos.length, 4);
});

test("a classified v2 cache survives restart with exactly the same public response", async () => {
  const playlists = { shorts: SHORTS_ID, fullVideos: FULL_ID };
  const first = harness({
    playlists,
    playlistEntries: { [SHORTS_ID]: [video(2)], [FULL_ID]: [video(1)] },
  });
  const expected = await first.getVideos();
  const second = harness({ playlists, cached: first.state.writes[0] });
  assert.deepEqual(await second.getVideos(), expected);
  assert.equal(second.state.calls.length, 0);
});

test("changing playlist configuration invalidates both disk and in-memory classification", async () => {
  const first = harness({
    playlists: { shorts: SHORTS_ID },
    playlistEntries: { [SHORTS_ID]: [video(1)] },
  });
  await first.getVideos();
  const second = harness({ cached: first.state.writes[0] });
  const fresh = await second.getVideos();
  assert.deepEqual(fresh.shorts, []);
  assert.equal(fresh.recentVideos.length, 4);
  assert.ok(second.state.calls.length > 0);
  first.state.playlists = { fullVideos: FULL_ID };
  assert.deepEqual((await first.getVideos()).shorts, []);
});

test("v1 and future-dated caches cannot supply stale category metadata", async () => {
  const cached = await validCache();
  for (const broken of [
    { ...cached, version: 1 },
    { ...cached, fetchedAt: NOW + HOUR, refreshAfter: NOW + 2 * HOUR },
  ]) {
    const { getVideos, state } = harness({ cached: broken });
    assert.equal((await getVideos()).recentVideos.length, 4);
    assert.ok(state.calls.length > 0);
  }
});

test("malformed category data is rejected and descriptions stay bounded public text", async () => {
  const cached = await validCache();
  const { getVideos, state } = harness({
    cached: {
      ...cached,
      feed: {
        ...cached.feed,
        shorts: [{ ...cached.feed.videos[0], thumbnail: "javascript:alert(1)" }],
      },
    },
    videos: [video(1, { description: "Texto técnico. ".repeat(100) })],
  });
  const feed = await getVideos();
  assert.ok(state.calls.length > 0);
  assert.equal(feed.recentVideos[0].description?.length, 500);
  assert.equal(
    JSON.stringify({ feed, logs: state.logs, cache: state.writes }).includes(TEST_KEY),
    false,
  );
});

test("partial cache retry timing persists across process restarts", async () => {
  const first = harness({ playlists: { shorts: SHORTS_ID }, optionalFailure: "lookup" });
  await first.getVideos();
  const cached = first.state.writes[0];
  const next = harness({
    cached,
    now: NOW + RETRY + 1,
    playlists: { shorts: SHORTS_ID },
    playlistEntries: { [SHORTS_ID]: [video(1)] },
  });
  assert.equal((await next.getVideos()).shorts.length, 1);
  assert.ok(next.state.calls.length > 0);
});
