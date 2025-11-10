import React from "react";
import { useParams, Link } from "react-router-dom";

export default function Ticket() {
  const { bookingId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 max-w-md w-full text-center relative overflow-hidden">
        {/* Decorative top red border */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

        {/* ✅ Success Icon */}
        <div className="flex justify-center mb-5 animate-fade-in">
          <div className="bg-green-100 rounded-full p-4 shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14 text-green-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* ✅ Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-gray-600 text-sm md:text-base mb-6">
          Your ticket has been successfully generated. Enjoy the show 🍿
        </p>

        {/* ✅ Ticket Link */}
        <a
          href={`/public/tickets/${bookingId}.pdf`}
          target="_blank"
          rel="noreferrer"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mb-5"
        >
          🎫 View Ticket PDF
        </a>

        {/* ✅ Booking Info */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 shadow-inner mb-6">
          <p>
            <span className="text-gray-700 font-medium">Booking ID:</span>{" "}
            <span className="font-mono text-gray-800">{bookingId}</span>
          </p>
          <p className="text-xs mt-1 text-gray-400">
            Save or screenshot this ID for reference.
          </p>
        </div>

        {/* ✅ Navigation Links */}
        <div className="flex justify-center gap-4 mt-4">
          <Link
            to="/"
            className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
          >
            ← Back to Home
          </Link>
          <Link
            to="/my"
            className="text-gray-800 hover:text-gray-900 font-medium text-sm transition-colors"
          >
            View My Tickets →
          </Link>
        </div>

        {/* Bottom fade effect */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600/70 via-transparent to-red-600/70"></div>
      </div>
    </div>
  );
}
