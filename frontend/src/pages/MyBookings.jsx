import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function MyBookings() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const t = localStorage.getItem("token");
      if (!t) {
        location.href = "/login";
        return;
      }
      try {
        const r = await api.get("/api/my/bookings", {
          headers: { Authorization: "Bearer " + t },
        });
        setRows(r.data || []);
      } catch (err) {
        console.error("Failed to load bookings", err);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8 md:p-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          🎫 My Bookings
        </h2>

        {rows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">
              You have no bookings yet. Go ahead and{" "}
              <span className="text-red-600 font-semibold">book your first movie!</span>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm md:text-base">
              <thead>
                <tr className="bg-red-600 text-white">
                  <th className="p-3 rounded-tl-lg text-left">Booking ID</th>
                  <th className="p-3 text-left">Show ID</th>
                  <th className="p-3 text-left">Seats</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 rounded-tr-lg text-center">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x, i) => (
                  <tr
                    key={x.id}
                    className={`hover:shadow-md transition-all rounded-lg ${
                      i % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="p-3 font-mono text-gray-700 break-all">{x.id}</td>
                    <td className="p-3 text-gray-700">{x.show_id}</td>
                    <td className="p-3 text-gray-600">
  {(x.seats || "").split(",").join(", ")}
</td>
                    <td className="p-3 font-semibold text-gray-800">
                      ₹{x.amount}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs md:text-sm font-medium capitalize ${
                          x.status === "paid"
                            ? "bg-green-100 text-green-700"
                            : x.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {x.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {x.status === "paid" ? (
                        <a
                          href={`/public/tickets/${x.id}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-600 hover:text-red-700 font-medium transition-colors underline-offset-2 hover:underline"
                        >
                          View Ticket
                        </a>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-8 text-gray-500 text-xs md:text-sm text-center">
            Tickets marked <span className="text-green-600 font-medium">Paid</span> are
            available for download as PDFs.
          </div>
        )}
      </div>
    </div>
  );
}
