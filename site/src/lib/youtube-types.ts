export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  url: string;
  description?: string;
};

export type YouTubeFeed = {
  videos: YouTubeVideo[];
  shorts: YouTubeVideo[];
  fullVideos: YouTubeVideo[];
  recentVideos: YouTubeVideo[];
  channel: { id: string; title: string; url: string } | null;
  updatedAt: string | null;
};
