import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [token, setToken] = useState(null);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [screens, setScreens] = useState([]);
  const [banners, setBanners] = useState([]);
  const [cinemaSel, setCinemaSel] = useState("");

  // ---------- LOGIN ----------
  async function login(e) {
    e.preventDefault();
    try {
      const r = await api.post(
        "/api/admin/login",
        Object.fromEntries(new FormData(e.target))
      );
      if (r.data.token) {
        setToken(r.data.token);
        localStorage.setItem("admin_token", r.data.token);
        loadData(r.data.token);
      } else alert("Invalid credentials");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  }

  // ---------- LOAD DATA ----------
  async function loadData(tok = token) {
    try {
const [m, c, s, b] = await Promise.all([
  api.get("/api/movies", { headers: { Authorization: "Bearer " + tok } }),
  api.get("/api/cinemas", { headers: { Authorization: "Bearer " + tok } }),
  api.get("/api/screens", { headers: { Authorization: "Bearer " + tok } }),
  api.get("/api/banners", { headers: { Authorization: "Bearer " + tok } }),
]);

      setMovies(m.data || []);
      setCinemas(c.data || []);
      setScreens(s.data || []);
      setBanners(b.data || []);
      setCinemaSel(c.data?.[0]?.id || "");
    } catch (err) {
      console.error("Data load failed:", err);
    }
  }

  // ---------- RESTORE SESSION ----------
  useEffect(() => {
    const t = localStorage.getItem("admin_token");
    if (t) setToken(t);
  }, []);
  useEffect(() => {
    if (token) loadData(token);
  }, [token]);

  // ---------- ADD MOVIE ----------
  async function addMovie(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: fd,
      });
      const j = await res.json();
      if (j.id) {
        alert("✅ Movie added!");
        loadData();
        e.target.reset();
      } else alert(j.error || "Failed to add movie");
    } catch {
      alert("Movie upload failed");
    }
  }

  // ---------- ADD CINEMA ----------
  async function addCinema(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      const r = await api.post("/api/admin/cinemas", d, {
        headers: { Authorization: "Bearer " + token },
      });
      if (r.data.id) {
        alert("✅ Cinema added!");
        loadData();
        e.target.reset();
      } else alert("Failed to add cinema");
    } catch (err) {
      alert(err.response?.data?.error || "Cinema add failed");
    }
  }

  // ---------- ADD SCREEN ----------
  async function addScreen(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const d = Object.fromEntries(fd);

    const layout = {
      aisles: (d.aisles || "")
        .split(",")
        .map((x) => parseInt(x.trim()))
        .filter((n) => !isNaN(n)),
      premiumRows: (d.premiumRows || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      reclinerRows: (d.reclinerRows || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      disabledSeats: (d.disabledSeats || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    d.layout_json = JSON.stringify(layout);

    try {
      const r = await api.post("/api/admin/screens", d, {
        headers: { Authorization: "Bearer " + token },
      });
      if (r.data.id) {
        alert("✅ Screen added!");
        loadData();
        e.target.reset();
      } else alert("Failed to add screen");
    } catch (err) {
      alert(err.response?.data?.error || "Screen add failed");
    }
  }

  // ---------- CREATE SHOW ----------
  async function createShow(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      const r = await api.post("/api/admin/shows", d, {
        headers: { Authorization: "Bearer " + token },
      });
      if (r.data.id) {
        alert("✅ Show created successfully!\nID: " + r.data.id);
        e.target.reset();
      } else alert(r.data.error || "Failed to create show");
    } catch (err) {
      alert(err.response?.data?.error || "Show creation failed");
    }
  }

  // ---------- BANNERS ----------
  async function addBanner(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
        body: fd,
      });
      const j = await res.json();
      if (j.id) {
        alert("✅ Banner added successfully!");
        loadData();
        e.target.reset();
      } else alert(j.error || "Failed to add banner");
    } catch (err) {
      alert("Banner upload failed");
    }
  }

  async function deleteBanner(id) {
    if (!window.confirm("Delete this banner permanently?")) return;
    try {
      await api.delete(`/api/admin/banners/${id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      alert("🗑️ Banner deleted!");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  }

  // ---------- LOGOUT ----------
  function logout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 md:px-8 text-black">
      {!token ? (
        <form
          onSubmit={login}
          className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-neutral-200 space-y-5"
        >
          <h3 className="text-2xl font-semibold text-center text-black">
            🎬 Admin Login
          </h3>
          <label className="block text-sm font-medium text-black">
            Username
            <input
              name="username"
              defaultValue="admin"
              required
              className="mt-1 w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-black">
            Password
            <input
              name="password"
              type="password"
              defaultValue="admin123"
              required
              className="mt-1 w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </label>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-all">
            Login
          </button>
        </form>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="flex justify-between items-center border-b border-neutral-200 pb-4">
            <h2 className="text-3xl font-semibold text-black">
              Admin Dashboard
            </h2>
            <button
              onClick={logout}
              className="text-sm text-black hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>

          {/* ✅ GRID LAYOUT */}
          <div className="grid gap-8 md:grid-cols-2 auto-rows-fr grid-flow-row-dense">
            {/* 🎞️ Add Movie */}
            <form
              onSubmit={addMovie}
              encType="multipart/form-data"
              className="bg-white p-6 rounded-xl shadow-md border border-neutral-200 flex flex-col justify-between"
            >
              <h3 className="text-lg font-semibold text-black mb-2">
                🎞️ Add Movie
              </h3>
              <div className="space-y-3">
                <input
                  name="title"
                  placeholder="Movie Title"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="duration"
                  placeholder="2h 30m"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="language"
                  placeholder="Language"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="certificate"
                  placeholder="U/A"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  type="file"
                  name="poster"
                  accept="image/*"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <select
                  name="banner_id"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                >
                  <option value="">Select Banner (Optional)</option>
                  {banners.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md w-full mt-4">
                Add Movie
              </button>
            </form>

            {/* 🏙️ Add Cinema */}
            <form
              onSubmit={addCinema}
              className="bg-white p-6 rounded-xl shadow-md border border-neutral-200"
            >
              <h3 className="text-lg font-semibold text-black mb-2">
                🏙️ Add Cinema
              </h3>
              <div className="space-y-3">
                <input
                  name="name"
                  placeholder="Cinema Name"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="city"
                  placeholder="City"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="address"
                  placeholder="Address"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md w-full mt-4">
                Add Cinema
              </button>
            </form>

            {/* 🖥️ Add Screen */}
            <form
              onSubmit={addScreen}
              className="bg-white p-6 rounded-xl shadow-md border border-neutral-200"
            >
              <h3 className="text-lg font-semibold text-black mb-2">
                🖥️ Add Screen (Dynamic Layout)
              </h3>
              <div className="space-y-3">
                <select
                  name="cinema_id"
                  value={cinemaSel}
                  onChange={(e) => setCinemaSel(e.target.value)}
                  className="w-full border border-neutral-300 p-2 rounded-md"
                >
                  {cinemas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} • {c.city}
                    </option>
                  ))}
                </select>
                <input
                  name="name"
                  placeholder="Screen 2"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    name="rows"
                    defaultValue="6"
                    required
                    className="border border-neutral-300 p-2 rounded-md"
                  />
                  <input
                    type="number"
                    name="cols"
                    defaultValue="12"
                    required
                    className="border border-neutral-300 p-2 rounded-md"
                  />
                </div>
                <input
                  name="aisles"
                  placeholder="Aisles e.g. 6"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="premiumRows"
                  placeholder="Premium Rows e.g. E,F"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="reclinerRows"
                  placeholder="Recliner Rows e.g. A"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="disabledSeats"
                  placeholder="Disabled Seats e.g. A1,A2"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md w-full mt-4">
                Add Screen
              </button>
            </form>

            {/* ⏰ Create Show */}
            <form
              onSubmit={createShow}
              className="bg-white p-6 rounded-xl shadow-md border border-neutral-200"
            >
              <h3 className="text-lg font-semibold text-black mb-2">
                ⏰ Create Show
              </h3>
              <div className="space-y-3">
                <select
                  name="movie_id"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <select
                  name="screen_id"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                >
                  {screens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • {s.id}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  name="show_date"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  name="show_time"
                  placeholder="06:30 PM"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <input
                  type="number"
                  name="price"
                  defaultValue="180"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md w-full mt-4">
                Create Show
              </button>
            </form>

            {/* 🖼️ Add Banner */}
            <form
              onSubmit={addBanner}
              encType="multipart/form-data"
              className="bg-white p-6 rounded-xl shadow-md border border-neutral-200"
            >
              <h3 className="text-lg font-semibold text-black mb-2">
                🖼️ Add Homepage Banner
              </h3>
              <div className="space-y-3">
                <input
                  name="title"
                  placeholder="Banner Title"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <textarea
                  name="description"
                  placeholder="Description"
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
                <select
                  name="movie_id"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                >
                  <option value="">Select Movie</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
                <input
                  type="file"
                  name="image"
                  accept="image/*"
                  required
                  className="w-full border border-neutral-300 p-2 rounded-md"
                />
              </div>
              <button className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-md w-full mt-4">
                Upload Banner
              </button>
            </form>

            {/* 🗑️ Delete Banners */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-200">
              <h3 className="text-lg font-semibold text-black mb-2">
                🗑️ Existing Banners
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {banners.length === 0 && (
                  <div className="text-sm text-gray-500">No banners yet.</div>
                )}
                {banners.map((b) => (
                  <div
                    key={b.id}
                    className="border rounded-lg overflow-hidden bg-neutral-50"
                  >
                    <img
                      src={b.image}
                      alt={b.title}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3 text-sm">
                      <p className="font-semibold truncate">{b.title}</p>
                      <p className="text-gray-500 text-xs truncate">
                        🎬 {b.movie_title || "Unknown Movie"}
                      </p>
                      <button
                        onClick={() => deleteBanner(b.id)}
                        className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-md text-xs transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
