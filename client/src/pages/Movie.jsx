import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import io from "socket.io-client";

export default function Movie() {
  const { id } = useParams();
  const [showsByDate, setShowsByDate] = useState({});
  const [meta, setMeta] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // 🧩 Load all shows and booked seats for this movie
  useEffect(() => {
    (async () => {
      try {
        const [rShows, rBooked] = await Promise.all([
          api.get("/api/shows", { params: { movie_id: id } }),
          api.get(`/api/movies/${id}/booked-seats`),
        ]);

        const grouped = {};
        for (let s of rShows.data || []) (grouped[s.show_date] ||= []).push(s);
        setShowsByDate(grouped);
        setBookedSeats(rBooked.data || []);
      } catch (e) {
        console.error("Failed to load shows/booked seats:", e);
      }
    })();
  }, [id]);

  function parseLayout(json) {
    try {
      return JSON.parse(json || "{}");
    } catch {
      return {};
    }
  }

  async function openShow(sid) {
    try {
      const r = await api.get("/api/shows/" + sid);
      setMeta(r.data);
      setSeats(r.data.seats || []);
      setSelected([]);
      setOpen(true);

      if (socketRef.current) socketRef.current.disconnect();
      const s = io();
      socketRef.current = s;
      s.emit("joinShow", sid);
      s.on("seats", (s) => setSeats(s));
    } catch (e) {
      alert(e?.response?.data?.error || "Unable to open show");
    }
  }

  useEffect(() => () => socketRef.current?.disconnect(), []);

  const layout = useMemo(() => parseLayout(meta?.layout_json), [meta]);
  const aisles = useMemo(() => new Set(layout.aisles || []), [layout]);

  function rowClass(letter) {
    if ((layout.reclinerRows || []).includes(letter)) return "bg-amber-100";
    if ((layout.premiumRows || []).includes(letter)) return "bg-rose-100";
    return "";
  }

  function toggle(code) {
    const rec = seats.find((x) => x.seat_code === code);
    if (!rec || rec.status !== "available") return;
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  }

  async function book() {
    if (!meta?.id) return alert("No show selected");
    if (!selected.length) return alert("Select at least one seat");

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to book tickets");
      location.href = "/login";
      return;
    }

    try {
      setLoading(true);
      const r = await api.post(
        "/api/book",
        { show_id: meta.id, seats: selected },
        { headers: { Authorization: "Bearer " + token } }
      );
      if (r.data?.bookingId) {
        location.href = "/checkout/" + r.data.bookingId;
      } else alert("Booking failed: " + (r.data?.error || "Unknown"));
    } catch (e) {
      alert("Booking failed: " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  function rowLabel(i) {
    return String.fromCharCode(65 + i);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-200 to-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
          🎥 Available Shows
        </h2>

        {Object.keys(showsByDate).length === 0 && (
          <div className="text-gray-700 text-sm bg-white p-4 rounded-lg shadow-md text-center">
            No shows found for this movie.
          </div>
        )}

        {Object.entries(showsByDate).map(([date, list]) => (
          <div key={date} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {new Date(date).toDateString()}
            </h3>
            <div className="flex flex-wrap gap-3">
              {list.map((s) => (
                <button
                  key={s.id}
                  onClick={() => openShow(s.id)}
                  className="bg-white border border-gray-300 text-black font-medium text-sm px-4 py-2 rounded-lg shadow-sm 
                             hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-md transition-all 
                             focus:ring-2 focus:ring-red-600 focus:outline-none"
                >
                  <span className="text-gray-900 font-semibold">
                    {s.cinema_name}
                  </span>{" "}
                  • <span className="text-gray-800">{s.screen_name}</span> •{" "}
                  <span className="text-gray-800">{s.show_time}</span> •{" "}
                  <span className="text-red-700 font-semibold">₹{s.price}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Seat Selection */}
        {open && meta && (
          <div className="mt-10 bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-200">
            <div className="text-center text-lg font-semibold text-gray-900 mb-3">
              {meta.title} — {meta.show_time}
            </div>
            <p className="text-center text-gray-600 mb-6">
              Price:{" "}
              <span className="font-semibold text-red-700">₹{meta.price}</span>{" "}
              per seat
            </p>

            {/* Legend */}
            <div className="flex justify-center gap-4 mb-6 flex-wrap text-xs text-gray-700">
              <Legend color="bg-green-500" label="Available" />
              <Legend color="bg-green-300" label="Premium Available" />
              <Legend color="bg-orange-400" label="Reserved" />
              <Legend color="bg-red-600" label="Booked" />
              <Legend color="bg-purple-700" label="Premium Booked" />
              <Legend color="bg-amber-300" label="Recliner Row" />
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto pb-4">
              <div className="flex flex-col items-center gap-1">
                {[...Array(meta?.rows || 0)].map((_, r) => (
                  <div key={r} className="flex items-center justify-center">
                    <div className="w-6 mr-2 text-gray-600 text-sm font-medium">
                      {rowLabel(r)}
                    </div>

                    {[...Array(meta?.cols || 0)].map((_, c) => {
                      const code = rowLabel(r) + (c + 1);
                      const rec = seats.find((x) => x.seat_code === code);
                      let status = rec?.status || "available";

                      // check if booked
                      if (status === "available") {
                        if (bookedSeats.some((b) => b.seat_code === code))
                          status = "sold";
                      }

                      const isPremiumRow = (layout.premiumRows || []).includes(
                        rowLabel(r)
                      );

                      // 🎨 Updated color scheme
                      let statusClass = "";
                      if (status === "available" && isPremiumRow)
                        statusClass =
                          "bg-green-300 hover:bg-green-400 text-black"; // Light green
                      else if (status === "available")
                        statusClass =
                          "bg-green-500 hover:bg-green-600 text-white"; // Regular green
                      else if (status === "reserved")
                        statusClass = "bg-orange-400 text-black";
                      else if (status === "sold" && isPremiumRow)
                        statusClass =
                          "bg-purple-700 text-white cursor-not-allowed";
                      else if (status === "sold")
                        statusClass =
                          "bg-red-600 text-white cursor-not-allowed";

                      const selectedClass = selected.includes(code)
                        ? "ring-4 ring-red-400 ring-offset-1 scale-110"
                        : "";

                      const extra = rowClass(rowLabel(r));

                      return (
                        <div
                          key={code}
                          className={`w-8 h-8 text-xs md:w-9 md:h-9 flex items-center justify-center rounded-md m-0.5 font-semibold cursor-pointer transition-all duration-150 ${statusClass} ${selectedClass} ${extra}`}
                          onClick={() => toggle(code)}
                        >
                          {c + 1}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 mb-8 text-center text-gray-700 text-xs font-medium tracking-wider">
              ─────────────── <span className="font-semibold">SCREEN</span>{" "}
              ───────────────
            </div>

            <div className="text-center">
              <button
                onClick={book}
                disabled={selected.length === 0 || loading}
                className={`bg-red-600 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md transition-all duration-200 ${
                  loading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-red-700 hover:scale-[1.03]"
                }`}
              >
                {loading
                  ? "Booking..."
                  : `Book Tickets${
                      selected.length ? ` (${selected.length})` : ""
                    }`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`w-3 h-3 rounded-sm ${color}`}></span> {label}
    </div>
  );
}
