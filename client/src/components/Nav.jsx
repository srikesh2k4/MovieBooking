import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, setAuth } from "../api";

export default function Nav() {
  const [user, setUser] = useState(null);
  const [mobile, setMobile] = useState(false);
  const navigate = useNavigate();

  // --- Fetch user dynamically based on token ---
  async function fetchUser() {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setAuth(null);
      return;
    }
    setAuth(token);

    try {
      // Call backend user info endpoint
      const r = await api.get("/api/me");
      if (r.data && r.data.name) {
        setUser(r.data);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("Failed to load user:", err);
      setUser(null);
      localStorage.removeItem("token");
    }
  }

  // --- Initialize user & watch storage changes ---
  useEffect(() => {
    fetchUser();
    const onStorage = () => fetchUser();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // --- Logout ---
  function logout() {
    localStorage.removeItem("token");
    setAuth(null);
    setUser(null);
    window.dispatchEvent(new Event("storage"));
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto h-[64px] px-4 flex items-center justify-between">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2">
          <img
  src="https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/bookmyshow-logo-hd.png"
  alt="BookMyShow"
  className="w-28 md:w-32"
/>

        </Link>

        {/* DESKTOP SEARCH */}
        <div className="hidden md:block">
          <div className="w-[420px] flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-red-600">
            <svg width="18" height="18" viewBox="0 0 24 24" className="text-gray-500">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 5l1.5-1.5l-5-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14"
              />
            </svg>
            <input
              placeholder="Search for Movies, Events, Plays, Sports and Activities"
              className="w-full outline-none text-sm bg-transparent text-gray-900 placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* AUTH BUTTONS */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/admin"
                className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
              >
                Admin
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-800 font-medium">
                👋 Hi, {user.name || "User"}
              </span>
              <Link
                to="/my"
                className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors"
              >
                My Tickets
              </Link>
              <Link
                to="/admin"
                className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-800 transition-colors"
              >
                Admin
              </Link>
              <button
                onClick={logout}
                className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white transition-colors"
              >
                Logout
              </button>
            </>
          )}

          {/* MOBILE TOGGLE */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobile((m) => !m)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              {mobile ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobile && (
        <div className="md:hidden bg-white border-t border-gray-200 py-3 px-4 space-y-3 shadow-lg">
          {!user ? (
            <>
              <Link
                to="/login"
                className="block bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-lg"
                onClick={() => setMobile(false)}
              >
                Sign In
              </Link>
              <Link
                to="/admin"
                className="block text-center py-2 rounded-md hover:bg-gray-100 text-gray-800"
                onClick={() => setMobile(false)}
              >
                Admin
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-800 text-center font-medium">
                👋 Hi, {user.name || "User"}
              </p>
              <Link
                to="/my"
                className="block text-center py-2 rounded-md hover:bg-gray-100 text-gray-800"
                onClick={() => setMobile(false)}
              >
                My Tickets
              </Link>
              <Link
                to="/admin"
                className="block text-center py-2 rounded-md hover:bg-gray-100 text-gray-800"
                onClick={() => setMobile(false)}
              >
                Admin
              </Link>
              <button
                className="w-full text-center py-2 rounded-md bg-gray-800 hover:bg-gray-900 text-white"
                onClick={logout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
