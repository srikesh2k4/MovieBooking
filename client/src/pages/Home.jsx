import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerAt, setBannerAt] = useState(0);

  // ---------- Fetch Movies ----------
  useEffect(() => {
    (async () => {
      try {
        const m = await api.get("/api/movies");
        setMovies(m.data || []);
      } catch {
        setMovies([]);
      }
    })();
  }, []);

  // ---------- Fetch Admin Banners ----------
  async function fetchBanners() {
    try {
      const res = await api.get("/api/banners");
      if (res.data && Array.isArray(res.data)) {
        setBanners(res.data);
      } else {
        setBanners([]);
      }
    } catch {
      setBanners([]);
    }
  }

  // Initial + Auto Refresh
  useEffect(() => {
    fetchBanners();
    const timer = setInterval(fetchBanners, 10000);
    return () => clearInterval(timer);
  }, []);

  // ---------- Auto Slide ----------
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(
      () => setBannerAt((a) => (a + 1) % banners.length),
      4000
    );
    return () => clearInterval(t);
  }, [banners]);

  const showPlaceholder = banners.length === 0;
  const showSingle = banners.length === 1;
  const showMultiple = banners.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* ============ Hero Slider ============ */}
      <section className="mx-auto max-w-7xl px-4 mt-0">
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          {/* 🖼️ No banners at all */}
          {showPlaceholder && (
            <div className="w-full h-[220px] md:h-[420px] bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              No banners uploaded yet.
            </div>
          )}

          {/* 🖼️ One single banner (no slideshow) */}
          {showSingle && (
            <Link
              to={
                banners[0].movie_id
                  ? `/movie/${banners[0].movie_id}`
                  : "#"
              }
            >
              <img
                src={
                  banners[0].image ||
                  "https://picsum.photos/1400/400?grayscale"
                }
                alt={banners[0].title || ""}
                className="w-full h-[220px] md:h-[420px] object-cover"
              />
            </Link>
          )}

          {/* 🖼️ Multiple banners — slideshow */}
          {showMultiple &&
            banners.map((b, i) => (
              <Link
                key={b.id || i}
                to={b.movie_id ? `/movie/${b.movie_id}` : "#"}
              >
                <img
                  src={b.image || "https://picsum.photos/1400/400?grayscale"}
                  alt={b.title || ""}
                  className={`w-full h-[220px] md:h-[420px] object-cover transition-opacity duration-700 ${
                    i === bannerAt
                      ? "opacity-100"
                      : "opacity-0 absolute inset-0"
                  }`}
                />
              </Link>
            ))}

          {/* Navigation Dots (only if multiple banners) */}
          {showMultiple && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerAt(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === bannerAt ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ Recommended Movies ============ */}
      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Recommended Movies
          </h2>
          <Link
            to="/"
            className="text-red-600 text-sm font-semibold hover:underline"
          >
            See All →
          </Link>
        </div>

        {movies.length === 0 && (
          <div className="text-sm text-gray-500">
            No movies yet. Add from Admin.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {movies.map((m) => (
            <article
              key={m.id}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <img
                src={m.poster || "https://picsum.photos/400/600?random=1"}
                alt={m.title}
                className="w-full aspect-[2/3] object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
                  {m.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {[m.language, m.certificate, m.duration]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
                <Link
                  to={`/movie/${m.id}`}
                  className="mt-3 block w-full text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-medium transition-all"
                >
                  Book Tickets
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ============ Stream / Events Section ============ */}
      <section className="mx-auto max-w-7xl px-4 mt-14">
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-8 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-white"
              >
                <path d="M20 2H4a2 2 0 0 0-2 2v16l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm opacity-90 tracking-wide uppercase">
                Stream
              </div>
              <div className="text-lg md:text-xl font-semibold">
                Endless Entertainment. Anytime. Anywhere!
              </div>
            </div>
          </div>
          <button className="bg-white text-gray-900 px-5 py-2 rounded-md font-semibold shadow-md hover:bg-gray-100 transition-all">
            Explore Now
          </button>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="mt-16 bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 text-xs leading-6 text-center opacity-80">
          <img
            src="/logo.svg"
            className="w-32 mx-auto mb-4 opacity-90"
            alt="BookMyShow"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <p className="text-gray-400 max-w-3xl mx-auto">
            The content and images used on this site are copyright protected and
            belong to their respective owners. Unauthorized use is prohibited
            and punishable by law.
          </p>
        </div>
      </footer>
    </div>
  );
}
