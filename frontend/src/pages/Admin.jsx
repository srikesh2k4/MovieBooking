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

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      loadData(saved);
    }
  }, []);

  useEffect(() => {
    if (token) localStorage.setItem("admin_token", token);
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
        alert("Movie added!");
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
        alert("Cinema added!");
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
      aisles: (d.aisles || "").split(",").map(x => parseInt(x.trim())).filter(n => !isNaN(n)),
      premiumRows: (d.premiumRows || "").split(",").map(s => s.trim()).filter(Boolean),
      reclinerRows: (d.reclinerRows || "").split(",").map(s => s.trim()).filter(Boolean),
      disabledSeats: (d.disabledSeats || "").split(",").map(s => s.trim()).filter(Boolean),
    };
    d.layout_json = JSON.stringify(layout);

    try {
      const r = await api.post("/api/screens", d, {
        headers: { Authorization: "Bearer " + token },
      });
      if (r.data.id) {
        alert("Screen added!");
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
        alert("Show created!\nID: " + r.data.id);
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
        alert("Banner added!");
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
      alert("Banner deleted!");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Delete failed");
    }
  }

  // ---------- DELETE MOVIE ----------
  async function deleteMovie(id) {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    try {
      await api.delete(`/api/admin/movies/${id}`, {
        headers: { Authorization: "Bearer " + token },
      });
      alert("Movie deleted!");
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete movie");
    }
  }

  // ---------- LOGOUT ----------
  function logout() {
    localStorage.removeItem("admin_token");
    setToken(null);
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-6 lg:px-8">
      {!token ? (
        <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-500">
          <h3 className="text-2xl font-bold text-center text-red-600 mb-2">
            Admin Login
          </h3>
          <p className="text-xs text-center text-gray-500 mb-6">
            Use: <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin</code> / <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin123</code>
          </p>
          <form onSubmit={login} className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Username</span>
              <input
                name="username"
                defaultValue="admin"
                required
                placeholder="Enter admin username"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-gray-700"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                name="password"
                type="password"
                defaultValue="admin123"
                required
                placeholder="Enter admin password"
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition placeholder:text-gray-700"
              />
            </label>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md">
              Login as Admin
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-4 border-b border-gray-500">
            <h1 className="text-3xl font-bold text-red-600">
              Admin Dashboard
            </h1>
            <button
              onClick={logout}
              className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 transition"
            >
              Logout
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 auto-rows-min">

            {/* Add Movie */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-500">
              <h3 className="text-lg font-bold text-red-600 mb-3">Add New Movie</h3>
              <p className="text-xs text-gray-500 mb-4">
                Upload <strong>poster</strong>: JPG only(Max 2MB)
              </p>
              <form onSubmit={addMovie} encType="multipart/form-data" className="space-y-4">
                <input name="title" placeholder="e.g. Jawan, Animal" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="duration" placeholder="e.g. 2h 50m" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="language" placeholder="e.g. Hindi, Tamil" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="certificate" placeholder="e.g. U/A, A" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <textarea name="description" placeholder="Short description (optional)" rows="2" className="w-full p-3 border rounded-lg text-sm resize-none placeholder:text-gray-700"></textarea>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Poster Image</p>
                  <input type="file" name="poster" accept="image/jpeg,image/png,image/webp" required className="w-full p-2 border rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-xs" />
                </div>
                <select name="banner_id" className="w-full p-3 border rounded-lg text-sm">
                  <option value="">No Banner (Optional)</option>
                  {banners.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all shadow">
                  Add Movie
                </button>
              </form>
            </div>

            {/* Add Cinema */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-500">
              <h3 className="text-lg font-bold text-red-600 mb-3">Add New Cinema</h3>
              <form onSubmit={addCinema} className="space-y-4">
                <input name="name" placeholder="e.g. PVR Phoenix Mall" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="city" placeholder="e.g. Mumbai" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <textarea name="address" placeholder="Full address with pincode" rows="2" className="w-full p-3 border rounded-lg text-sm resize-none placeholder:text-gray-700"></textarea>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all shadow">
                  Add Cinema
                </button>
              </form>
            </div>

            {/* Add Screen */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-500">
              <h3 className="text-lg font-bold text-red-600 mb-3">Add Screen Layout</h3>
              <form onSubmit={addScreen} className="space-y-4">
                <select name="cinema_id" value={cinemaSel} onChange={e => setCinemaSel(e.target.value)} required className="w-full p-3 border rounded-lg text-sm">
                  <option value="">Select Cinema</option>
                  {cinemas.map(c => (
                    <option key={c.id} value={c.id}>{c.name} – {c.city}</option>
                  ))}
                </select>
                <input name="name" placeholder="e.g. Audi 2" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" name="rows" defaultValue="6" min="1" required placeholder="Rows" className="p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                  <input type="number" name="cols" defaultValue="12" min="1" required placeholder="Columns" className="p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                </div>
                <input name="aisles" placeholder="Aisle cols e.g. 6" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="premiumRows" placeholder="Premium e.g. E,F" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="reclinerRows" placeholder="Recliner e.g. A,B" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input name="disabledSeats" placeholder="Disabled e.g. A1,F6" className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all shadow">
                  Add Screen
                </button>
              </form>
            </div>

            {/* Create Show */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-700">
              <h3 className="text-lg font-bold text-red-600 mb-3">Schedule Show</h3>
              <form onSubmit={createShow} className="space-y-4">
                <select name="movie_id" required className="w-full p-3 border rounded-lg text-sm">
                  <option value="">Select Movie</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <select name="screen_id" required className="w-full p-3 border rounded-lg text-sm">
                  <option value="">Select Screen</option>
                  {screens.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input type="date" name="show_date" required min={new Date().toISOString().split("T")[0]} className="w-full p-3 border rounded-lg text-sm" />
                <input name="show_time" placeholder="e.g. 06:30 PM" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <input type="number" name="price" defaultValue="180" min="50" placeholder="Price in ₹" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all shadow">
                  Create Show
                </button>
              </form>
            </div>

            {/* Add Banner */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-500">
              <h3 className="text-lg font-bold text-red-600 mb-3">Upload Homepage Banner</h3>
              <p className="text-xs text-gray-500 mb-4">
                <strong>Image:</strong> JPG, PNG, WEBP (1920×600 recommended, Max 2MB)
              </p>
              <form onSubmit={addBanner} encType="multipart/form-data" className="space-y-4">
                <input name="title" placeholder="e.g. Now Showing: Jawan" required className="w-full p-3 border rounded-lg text-sm placeholder:text-gray-700" />
                <textarea name="description" placeholder="Subtitle (optional)" rows="2" className="w-full p-3 border rounded-lg text-sm resize-none placeholder:text-gray-700"></textarea>
                <select name="movie_id" required className="w-full p-3 border rounded-lg text-sm">
                  <option value="">Link to Movie</option>
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1">Banner Image</p>
                  <input type="file" name="image" accept="image/jpeg,image/png,image/webp" required className="w-full p-2 border rounded-lg text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-red-600 file:text-white file:text-xs" />
                </div>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium text-sm transition-all shadow">
                  Upload Banner
                </button>
              </form>
            </div>

            {/* Existing Movies */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 xl:col-span-2">
              <h3 className="text-lg font-bold text-red-600 mb-3">Existing Movies ({movies.length})</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto pr-2">
                {movies.length === 0 ? (
                  <p className="col-span-full text-center text-gray-500 py-6">No movies added yet.</p>
                ) : (
                  movies.map(m => (
                    <div key={m.id} className="group relative bg-gray-50 rounded-xl overflow-hidden shadow hover:shadow-xl transition-all">
                      <img src={m.poster || "https://via.placeholder.com/300x400?text=No+Image"} alt={m.title} className="w-full h-48 object-cover" />
                      <div className="p-3">
                        <p className="font-semibold text-sm truncate">{m.title}</p>
                        <p className="text-xs text-gray-500">{m.language} • {m.certificate}</p>
                        <button onClick={() => deleteMovie(m.id)} className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-medium transition">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Existing Banners */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-500">
              <h3 className="text-lg font-bold text-red-600 mb-3">Homepage Banners ({banners.length})</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {banners.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">No banners uploaded.</p>
                ) : (
                  banners.map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:shadow transition">
                      <img src={b.image} alt={b.title} className="w-20 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{b.title}</p>
                        <p className="text-xs text-gray-500">Linked: {b.movie_title || "—"}</p>
                      </div>
                      <button onClick={() => deleteBanner(b.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}