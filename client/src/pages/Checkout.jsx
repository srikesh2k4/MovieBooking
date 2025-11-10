import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Checkout() {
  const { bookingId } = useParams();
  const nav = useNavigate();

  const [showUPI, setShowUPI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(5);

  async function pay(method = "upi") {
    const t = localStorage.getItem("token");
    if (!t) {
      alert("Please log in first");
      location.href = "/login";
      return;
    }

    if (method === "upi") {
      setShowUPI(true);
      setCountdown(5);
      let timer = 5;

      const interval = setInterval(() => {
        timer--;
        setCountdown(timer);
        if (timer === 0) {
          clearInterval(interval);
          simulateUPISuccess();
        }
      }, 1000);
      return;
    }

    // For non-UPI payments (instant mock success)
    handlePayment(method);
  }

  async function simulateUPISuccess() {
    try {
      setLoading(true);
      const t = localStorage.getItem("token");
      const r = await api.post(
        "/api/payment",
        { bookingId, method: "upi" },
        { headers: { Authorization: "Bearer " + t } }
      );

      if (r.data.success) {
        setShowUPI(false);
        alert("✅ Payment Successful via UPI!");
        nav("/ticket/" + bookingId);
      } else {
        alert(r.data.error || "Payment failed");
      }
    } catch (err) {
      alert("Payment error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(method) {
    try {
      setLoading(true);
      const t = localStorage.getItem("token");
      const r = await api.post(
        "/api/payment",
        { bookingId, method },
        { headers: { Authorization: "Bearer " + t } }
      );

      if (r.data.success) {
        alert("✅ Payment Successful!");
        nav("/ticket/" + bookingId);
      } else {
        alert(r.data.error || "Payment failed");
      }
    } catch (err) {
      alert("Payment error: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-white px-4 py-10">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md overflow-hidden border border-gray-100 relative">
        {/* Header */}
        <div className="bg-gray-900 text-white text-center py-6 px-6">
          <h1 className="text-2xl font-semibold tracking-wide">
            Complete Your Payment
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Booking ID:{" "}
            <span className="font-semibold text-red-500">{bookingId}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <p className="text-gray-700 text-center leading-relaxed">
            Choose your preferred payment method below to finalize your booking.
          </p>

          <div className="space-y-4">
            {/* UPI */}
            <button
              onClick={() => pay("upi")}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg w-full shadow-md transition-transform transform hover:scale-[1.02]"
            >
              <span className="text-lg">💳</span> Pay with UPI
            </button>

            {/* Netbanking */}
            <button
              onClick={() => handlePayment("netbanking")}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-3 rounded-lg w-full shadow-md transition-transform transform hover:scale-[1.02]"
            >
              <span className="text-lg">🏦</span> Pay with Netbanking
            </button>

            {/* Wallet / Paytm */}
            <button
              onClick={() => handlePayment("wallet")}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg w-full shadow-md transition-transform transform hover:scale-[1.02]"
            >
              <span className="text-lg">📱</span> Pay with Wallet / Paytm
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
            This is a <strong>mock payment screen</strong>. No real money will be deducted.
          </div>
        </div>

        {/* ✅ UPI Simulation Modal */}
        {showUPI && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-6 text-center w-[90%] max-w-sm animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                UPI Payment in Progress
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Scan the QR below or wait for automatic confirmation.
              </p>

              {/* Fake QR Code */}
              <div className="mx-auto w-40 h-40 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=bookmyshow@upi')] bg-cover border border-gray-300 rounded-lg shadow-inner"></div>

              <p className="mt-4 text-gray-600 text-sm">
                Auto-confirming in{" "}
                <span className="text-red-600 font-semibold">
                  {countdown}
                </span>{" "}
                seconds...
              </p>

              <div className="mt-5 flex justify-center gap-3">
                <button
                  onClick={simulateUPISuccess}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  ✅ I’ve Paid
                </button>
                <button
                  onClick={() => setShowUPI(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
