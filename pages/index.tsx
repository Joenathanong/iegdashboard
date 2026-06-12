import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { Slide } from "../lib/types";

export default function Player() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const slidesRef = useRef<Slide[]>([]);

  const fetchSlides = useCallback(async () => {
    try {
      const res = await fetch("/api/slides");
      const data = await res.json();
      if (data.slides && data.slides.length > 0) {
        const newSlides: Slide[] = data.slides;
        slidesRef.current = newSlides;
        setSlides(newSlides);
        // Only reset to 0 if slide list changed significantly
        setCurrent((prev) => (prev >= newSlides.length ? 0 : prev));
        setTimeLeft((prev) => (prev === 0 ? newSlides[0]?.duration ?? 30 : prev));
      } else {
        setSlides([]);
        slidesRef.current = [];
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlides();
    // Poll every 15 seconds to pick up changes from admin
    const refreshTimer = setInterval(fetchSlides, 15000);
    return () => clearInterval(refreshTimer);
  }, [fetchSlides]);

  useEffect(() => {
    if (slides.length === 0 || paused) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCurrent((c) => {
            const next = (c + 1) % slidesRef.current.length;
            setTimeout(() => setTimeLeft(slidesRef.current[next]?.duration ?? 30), 0);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [slides, paused]);

  const goTo = (idx: number) => {
    if (slides.length === 0) return;
    const target = (idx + slides.length) % slides.length;
    setCurrent(target);
    setTimeLeft(slides[target].duration);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  if (loading) {
    return (
      <div className="player-empty">
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <p>Memuat slideshow...</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <>
        <Head><title>TV Slideshow</title></Head>
        <div className="player-empty">
          <div style={{ fontSize: "3rem" }}>📺</div>
          <h2>Belum ada slide aktif</h2>
          <p>Tambahkan link di menu admin untuk memulai slideshow.</p>
          <Link href="/admin" className="btn btn-primary" style={{ marginTop: 8 }}>
            Buka Admin
          </Link>
        </div>
      </>
    );
  }

  const slide = slides[current];
  const progress = ((slide.duration - timeLeft) / slide.duration) * 100;

  return (
    <>
      <Head>
        <title>TV Slideshow — {slide.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="player-container" onMouseMove={handleMouseMove}>

        {/* Iframe dengan fallback */}
        <IframeWithFallback key={slide.id + current} slide={slide} />

        {/* Nav buttons */}
        <button className="player-nav-btn prev" onClick={() => goTo(current - 1)}>‹</button>
        <button className="player-nav-btn next" onClick={() => goTo(current + 1)}>›</button>

        {/* Controls */}
        <button
          className="player-pause-btn"
          onClick={() => setPaused((p) => !p)}
          style={{ opacity: showControls ? 1 : 0 }}
        >
          {paused ? "▶ Lanjutkan" : "⏸ Jeda"}
        </button>

        <Link href="/admin" className="player-admin-link" style={{ opacity: showControls ? 1 : 0 }}>
          ⚙ Admin
        </Link>

        {/* Bottom overlay */}
        <div className="player-overlay">
          <div className="player-progress-bar">
            <div className="player-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className={`player-info-bar ${showControls ? "visible" : ""}`}>
            <span className="player-title">
              {paused && <span style={{ color: "#f59e0b", marginRight: 8 }}>⏸</span>}
              {slide.title}
            </span>
            <div className="player-dots">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={`player-dot ${i === current ? "active" : ""}`}
                  onClick={() => goTo(i)}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
            <span className="player-timer">{paused ? "⏸" : "⏱"} {timeLeft}s</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Komponen iframe dengan deteksi error + fallback
function IframeWithFallback({ slide }: { slide: Slide }) {
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setBlocked(false);
    // Deteksi jika iframe tidak bisa load setelah 5 detik
    const timer = setTimeout(() => {
      try {
        const iframe = iframeRef.current;
        if (iframe) {
          // Coba akses contentDocument — akan null jika cross-origin blocked
          const doc = iframe.contentDocument;
          if (doc === null) {
            // Normal untuk cross-origin, bukan berarti error
          }
        }
      } catch {
        setBlocked(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [slide.id]);

  if (blocked) {
    return (
      <div className="iframe-blocked">
        <div className="iframe-blocked-content">
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🚫</div>
          <h2>{slide.title}</h2>
          <p>Halaman ini memblokir tampilan dalam iframe.</p>
          <a href={slide.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: 16 }}>
            🔗 Buka di Tab Baru
          </a>
        </div>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={slide.url}
      className="player-iframe"
      title={slide.title}
      onError={() => setBlocked(true)}
    />
  );
}
