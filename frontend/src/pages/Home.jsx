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
          {showPlaceholder && (
            <div className="w-full h-[220px] md:h-[420px] bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              No banners uploaded yet.
            </div>
          )}

          {showSingle && (
            <Link to={banners[0].movie_id ? `/movie/${banners[0].movie_id}` : "#"}>
              <img
                src={banners[0].image || "https://picsum.photos/1400/400?grayscale"}
                alt={banners[0].title || ""}
                className="w-full h-[220px] md:h-[420px] object-cover"
              />
            </Link>
          )}

          {showMultiple &&
            banners.map((b, i) => (
              <Link key={b.id || i} to={b.movie_id ? `/movie/${b.movie_id}` : "#"}>
                <img
                  src={b.image || "https://picsum.photos/1400/400?grayscale"}
                  alt={b.title || ""}
                  className={`w-full h-[220px] md:h-[420px] object-cover transition-opacity duration-700 ${
                    i === bannerAt ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                />
              </Link>
            ))}

          {showMultiple && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerAt(i)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === bannerAt ? "bg-white shadow-lg scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ Recommended Movies – BETTER GRID + NEON HOVER ============ */}
      <section className="mx-auto max-w-7xl px-4 mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Recommended Movies
          </h2>
          <Link to="/" className="text-red-600 text-sm font-semibold hover:underline">
            See All
          </Link>
        </div>

        {movies.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            No movies yet. Add from Admin.
          </div>
        )}

        {/* RESPONSIVE GRID: 2 → 3 → 4 → 6 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 md:gap-6">
          {movies.map((m) => (
            <article
              key={m.id}
              className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100"
            >
              {/* NEON GLOW BORDER ON HOVER */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 blur-lg animate-pulse"></div>
              </div>

              {/* Image with zoom */}
              <div className="relative overflow-hidden">
                <img
                  src={m.poster || "https://picsum.photos/400/600?random=1"}
                  alt={m.title}
                  className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Content */}
              <div className="p-3 md:p-4 relative z-10">
                <h3 className="font-bold text-sm md:text-base text-gray-900 truncate group-hover:text-white transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-200 transition-colors">
                  {[m.language, m.certificate, m.duration].filter(Boolean).join(" • ")}
                </p>
                <Link
                  to={`/movie/${m.id}`}
                  className="mt-3 block w-full text-center bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-xs md:text-sm font-semibold transition-all transform group-hover:scale-105 group-hover:bg-gradient-to-r group-hover:from-pink-500 group-hover:to-purple-500"
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
        <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-8 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 blur-3xl animate-pulse"></div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-lg">
                <path d="M20 2H4a2 2 0 0 0-2 2v16l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm opacity-90 tracking-wide uppercase font-medium">Stream</div>
              <div className="text-lg md:text-xl font-semibold">
                Endless Entertainment. Anytime. Anywhere!
              </div>
            </div>
          </div>
          <button className="relative bg-white text-gray-900 px-5 py-2 rounded-md font-semibold shadow-md hover:bg-gray-100 transition-all z-10 overflow-hidden group">
            <span className="relative z-10">Explore Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></div>
          </button>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="mt-16 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-tl from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 relative z-10">
          <div className="text-center mb-8">
            <img
              src="/logo.svg"
              className="w-40 mx-auto mb-4 opacity-90 drop-shadow-2xl"
              alt="BookMyShow"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <p className="text-lg font-medium text-gray-300">Your Ultimate Movie Experience</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mb-10">
            {["Company", "Support", "Legal", "Connect"].map((title) => (
              <div key={title}>
                <h4 className="font-bold text-white mb-2">{title}</h4>
                <ul className="space-y-1 text-gray-400">
                  {title === "Company" && ["About Us", "Careers", "Press"].map((item) => (
                    <li key={item}><Link to="#" className="hover:text-white transition">{item}</Link></li>
                  ))}
                  {title === "Support" && ["Help Center", "Contact", "FAQs"].map((item) => (
                    <li key={item}><Link to="#" className="hover:text-white transition">{item}</Link></li>
                  ))}
                  {title === "Legal" && ["Terms of Use", "Privacy Policy", "Cookie Policy"].map((item) => (
                    <li key={item}><Link to="#" className="hover:text-white transition">{item}</Link></li>
                  ))}
                  {title === "Connect" && ["Facebook", "Twitter", "Instagram"].map((item) => (
                    <li key={item}><Link to="#" className="hover:text-white transition">{item}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-pink-500 to-transparent opacity-50 my-8"></div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>
              © 2025 <span className="text-pink-400 font-medium">BookMyShow Clone</span> by{" "}
              <a href="https://github.com/kotipallisrikesh" target="_blank" rel="noopener" className="text-cyan-400 hover:text-cyan-300 transition font-medium">
                Kotipalli Srikesh
              </a>
            </p>
            <p className="max-w-4xl mx-auto">
              All movie titles, images, and trademarks are the property of their respective owners. This is a
              non-commercial clone for educational purposes only. Unauthorized use is prohibited.
            </p>
            <p className="mt-2 text-gray-600">
              Powered by <span className="text-purple-400 font-medium">Kotipalli Srikesh</span> • SRM University • Chennai
            </p>
          </div>

          <div className="flex justify-center mt-6">
            <div className="px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs font-bold text-white shadow-lg animate-pulse">
              LIVE • NOV 11, 2025
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}