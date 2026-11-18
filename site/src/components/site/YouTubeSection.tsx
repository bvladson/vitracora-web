import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Play, X, Youtube } from "lucide-react";
import type { YouTubeFeed, YouTubeVideo } from "@/lib/youtube-types";

const CHANNEL_URL = "https://www.youtube.com/@vsbseguranca";

function publicationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function Thumbnail({ video, shorts = false }: { video: YouTubeVideo; shorts?: boolean }) {
  const [failedImages, setFailedImages] = useState(0);
  const images = [
    ...new Set([
      video.thumbnail,
      `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
      `https://i.ytimg.com/vi/${video.id}/default.jpg`,
    ]),
  ];

  return (
    <span className={`youtube-thumbnail${shorts ? " youtube-thumbnail--short" : ""}`}>
      {images[failedImages] ? (
        <img
          src={images[failedImages]}
          alt=""
          width={shorts ? 405 : 1280}
          height={720}
          loading="lazy"
          decoding="async"
          onError={() => setFailedImages((count) => count + 1)}
        />
      ) : (
        <span className="youtube-thumbnail-fallback" aria-hidden="true">
          <span>VSB</span>
          Conteúdo técnico no YouTube
        </span>
      )}
      <span className="youtube-play" aria-hidden="true">
        <Play size={23} fill="currentColor" strokeWidth={1.5} />
      </span>
    </span>
  );
}

function VideoDialog({ video, onClose }: { video: YouTubeVideo; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const watchLinkRef = useRef<HTMLAnchorElement>(null);
  const backdropPressed = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="youtube-dialog"
      aria-labelledby="youtube-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const first = closeRef.current;
        const last = watchLinkRef.current;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onPointerDown={(event) => {
        backdropPressed.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (backdropPressed.current && event.target === event.currentTarget) onClose();
        backdropPressed.current = false;
      }}
    >
      <div className="youtube-dialog-content">
        <div className="youtube-dialog-bar">
          <span>
            <Youtube size={20} aria-hidden="true" /> VSB no YouTube
          </span>
          <button
            ref={closeRef}
            type="button"
            className="youtube-dialog-close"
            onClick={onClose}
            aria-label="Fechar vídeo"
          >
            <X size={23} aria-hidden="true" />
          </button>
        </div>
        <div className="youtube-dialog-player">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=0&playsinline=1&hl=pt-BR`}
            title={`VSB no YouTube: ${video.title}`}
            width={1280}
            height={720}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        <div className="youtube-dialog-caption">
          <h3 id="youtube-dialog-title">{video.title}</h3>
          <a ref={watchLinkRef} href={video.url} target="_blank" rel="noopener noreferrer">
            Assistir no YouTube <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>
    </dialog>
  );
}

function VideoCard({
  video,
  featured,
  onOpen,
}: {
  video: YouTubeVideo;
  featured: boolean;
  onOpen: (event: MouseEvent<HTMLAnchorElement>, video: YouTubeVideo) => void;
}) {
  const date = publicationDate(video.publishedAt);
  return (
    <article className={`youtube-video-card${featured ? " youtube-video-card--featured" : ""}`}>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="youtube-video-link"
        aria-label={`Assistir: ${video.title}`}
        aria-haspopup="dialog"
        onClick={(event) => onOpen(event, video)}
      >
        <span className="youtube-video-cover">
          <Thumbnail video={video} />
          {featured && <span className="youtube-latest">Mais recente</span>}
        </span>
        <div className="youtube-card-copy">
          {date && (
            <time className="youtube-meta" dateTime={video.publishedAt}>
              {date}
            </time>
          )}
          <h4>{video.title}</h4>
          {featured && video.description && (
            <p className="youtube-description">{video.description}</p>
          )}
          <span className="youtube-watch-label">
            Assistir ao vídeo <ArrowUpRight size={17} aria-hidden="true" />
          </span>
        </div>
      </a>
    </article>
  );
}

function Skeletons({ shorts = false }: { shorts?: boolean }) {
  if (shorts) {
    return (
      <div className="youtube-shorts-track youtube-skeleton-track" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="youtube-short-card youtube-skeleton youtube-skeleton-short" />
        ))}
      </div>
    );
  }
  return (
    <div className="youtube-editorial youtube-skeleton-editorial" aria-hidden="true">
      <div className="youtube-skeleton youtube-skeleton-video" />
      <div className="youtube-skeleton-side">
        <div className="youtube-skeleton youtube-skeleton-video" />
        <div className="youtube-skeleton youtube-skeleton-line" />
        <div className="youtube-skeleton youtube-skeleton-line" />
      </div>
    </div>
  );
}

export function YouTubeSection() {
  const [feed, setFeed] = useState<YouTubeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [canScroll, setCanScroll] = useState({ previous: false, next: false });
  const trackRef = useRef<HTMLDivElement>(null);
  const shorts = feed?.shorts ?? [];
  const fullVideos = feed?.fullVideos ?? [];
  // Uploads stay unclassified: duration and hashtags do not identify Shorts.
  const recentVideos = feed?.recentVideos ?? feed?.videos ?? [];
  const videos = (fullVideos.length ? fullVideos : recentVideos).slice(0, 4);
  const hasFullVideos = fullVideos.length > 0;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    let mounted = true;
    async function loadVideos() {
      try {
        const response = await fetch("/api/youtube/videos", {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("YouTube feed unavailable");
        const nextFeed = (await response.json()) as YouTubeFeed;
        if (!Array.isArray(nextFeed.videos)) throw new Error("Invalid YouTube feed");
        for (const group of [nextFeed.shorts, nextFeed.fullVideos, nextFeed.recentVideos]) {
          if (group !== undefined && !Array.isArray(group))
            throw new Error("Invalid YouTube group");
        }
        if (mounted) setFeed(nextFeed);
      } catch {
        // Provider errors stay on the server; access to the official channel remains available.
        if (mounted) setFeed(null);
      } finally {
        window.clearTimeout(timeout);
        if (mounted) setLoading(false);
      }
    }
    void loadVideos();
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function updateControls() {
      if (!track) return;
      setCanScroll({
        previous: track.scrollLeft > 4,
        next: track.scrollLeft + track.clientWidth < track.scrollWidth - 4,
      });
    }
    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", updateControls);
      observer.disconnect();
    };
  }, [loading, shorts.length]);

  function openVideo(event: MouseEvent<HTMLAnchorElement>, video: YouTubeVideo) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    if (typeof HTMLDialogElement === "undefined" || !("showModal" in HTMLDialogElement.prototype))
      return;
    event.preventDefault();
    setSelectedVideo(video);
  }

  function scrollShorts(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({
      left: direction * track.clientWidth * 0.85,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section
      id="youtube"
      className="identity-section youtube-section"
      aria-labelledby="youtube-heading"
    >
      <div className="identity-container youtube-hub">
        <header className="youtube-header">
          <div className="youtube-intro">
            <p className="youtube-eyebrow">
              <Youtube size={24} aria-hidden="true" /> VSB no YouTube
            </p>
            <h2 id="youtube-heading">Técnica na prática.</h2>
            <p className="youtube-intro-text">
              Diagnósticos, instalações, reparos e soluções técnicas registrados em campo.
            </p>
          </div>
          <a
            className="youtube-channel-link"
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver canal <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </header>

        <div className="youtube-content" aria-busy={loading}>
          {loading && (
            <p className="sr-only" role="status">
              Carregando conteúdos do canal da VSB…
            </p>
          )}
          <section className="youtube-shorts" aria-labelledby="youtube-shorts-heading">
            <div className="youtube-block-heading">
              <div>
                <h3 id="youtube-shorts-heading">
                  <span className="youtube-shorts-dot" aria-hidden="true" /> Shorts
                </h3>
                <p>Rápido e direto</p>
              </div>
              {shorts.length > 0 && (
                <div className="youtube-carousel-controls">
                  <button
                    type="button"
                    onClick={() => scrollShorts(-1)}
                    disabled={!canScroll.previous}
                    aria-label="Shorts anteriores"
                    aria-controls="youtube-shorts-track"
                  >
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollShorts(1)}
                    disabled={!canScroll.next}
                    aria-label="Próximos Shorts"
                    aria-controls="youtube-shorts-track"
                  >
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
            {loading ? (
              <Skeletons shorts />
            ) : shorts.length > 0 ? (
              <>
                <div
                  id="youtube-shorts-track"
                  ref={trackRef}
                  className="youtube-shorts-track"
                  role="group"
                  aria-label="Shorts da VSB"
                >
                  {shorts.map((video) => (
                    <article key={video.id} className="youtube-short-card">
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="youtube-short-link"
                        aria-label={`Assistir Short: ${video.title}`}
                        aria-haspopup="dialog"
                        onClick={(event) => openVideo(event, video)}
                      >
                        <Thumbnail video={video} shorts />
                        <span className="youtube-short-badge">
                          <Play size={11} fill="currentColor" aria-hidden="true" /> Shorts
                        </span>
                        <div className="youtube-short-copy">
                          <h4>{video.title}</h4>
                          <span>
                            Assistir <ArrowUpRight size={15} aria-hidden="true" />
                          </span>
                        </div>
                      </a>
                    </article>
                  ))}
                </div>
                {shorts.length > 1 && (
                  <p className="youtube-swipe-hint">
                    Deslize para explorar <ArrowRight size={16} aria-hidden="true" />
                  </p>
                )}
              </>
            ) : (
              <div className="youtube-empty youtube-empty--shorts">
                <p>Explore também os conteúdos rápidos no canal da VSB.</p>
                <a href={`${CHANNEL_URL}/shorts`} target="_blank" rel="noopener noreferrer">
                  Ver Shorts no YouTube <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
            )}
          </section>

          <section className="youtube-videos" aria-labelledby="youtube-videos-heading">
            <div className="youtube-block-heading">
              <div>
                <h3 id="youtube-videos-heading">
                  {loading || hasFullVideos || !videos.length
                    ? "Vídeos completos"
                    : "Últimas publicações"}
                </h3>
                <p>Veja o trabalho de perto</p>
              </div>
              {videos.length > 0 && (
                <span className="youtube-section-note">Direto do canal da VSB</span>
              )}
            </div>
            {loading ? (
              <Skeletons />
            ) : videos.length > 0 ? (
              <div
                className={`youtube-editorial${videos.length === 1 ? " youtube-editorial--single" : ""}`}
              >
                <VideoCard video={videos[0]} featured onOpen={openVideo} />
                {videos.length > 1 && (
                  <div className="youtube-editorial-side">
                    {videos.slice(1).map((video) => (
                      <VideoCard key={video.id} video={video} featured={false} onOpen={openVideo} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="youtube-empty youtube-empty--videos" role="status">
                <span className="youtube-empty-icon" aria-hidden="true">
                  <Youtube size={34} strokeWidth={1.5} />
                </span>
                <div>
                  <h4>Confira nossos conteúdos no YouTube.</h4>
                  <p>Conhecimento técnico e soluções na prática, direto da VSB.</p>
                </div>
                <a href={CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  Visitar canal da VSB <ArrowUpRight size={17} aria-hidden="true" />
                </a>
              </div>
            )}
          </section>
        </div>

        <footer className="youtube-footer">
          <p>Mais conteúdo técnico no YouTube.</p>
          <a
            className="youtube-subscribe"
            href={CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Youtube size={21} aria-hidden="true" /> Acompanhar a VSB no YouTube{" "}
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </footer>
      </div>
      {selectedVideo && (
        <VideoDialog video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </section>
  );
}
