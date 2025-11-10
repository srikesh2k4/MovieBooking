import React from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ---- LOGIN ----
  async function onLogin(e) {
    e.preventDefault();
    try {
      const form = Object.fromEntries(new FormData(e.target));
      const r = await api.post("/api/auth/login", form);
      if (r.data.token) {
        localStorage.setItem("token", r.data.token);
        setAuth(r.data.token);
        login(r.data.token);
        navigate("/");
      } else alert("Login failed.");
    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
  }

  // ---- REGISTER ----
  async function onRegister(e) {
    e.preventDefault();
    try {
      const form = Object.fromEntries(new FormData(e.target));
      const r = await api.post("/api/auth/register", form);
      if (r.data.token) {
        localStorage.setItem("token", r.data.token);
        setAuth(r.data.token);
        login(r.data.token);
        navigate("/");
      } else alert("Registration failed.");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-white px-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 md:p-10 relative overflow-hidden border border-gray-100">
        {/* HEADER */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome to{" "}
            <span className="text-red-600 drop-shadow-sm">BookMyShow</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in or create an account to continue
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={onLogin}
          className="space-y-4 border-t border-gray-200 pt-5"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🔑 User Login
          </h3>

          <label className="block">
            <span className="text-sm text-gray-600">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Password</span>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-md font-medium transition-transform transform hover:scale-[1.02] shadow-md"
          >
            Login
          </button>
        </form>

        {/* REGISTER FORM */}
        <form
          onSubmit={onRegister}
          className="space-y-4 border-t border-gray-200 pt-6 mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            🆕 Register
          </h3>

          <label className="block">
            <span className="text-sm text-gray-600">Full Name</span>
            <input
              name="name"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Password</span>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none transition"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-md font-medium transition-transform transform hover:scale-[1.02] shadow-md"
          >
            Create Account
          </button>
        </form>

        {/* FOOTER NOTE */}
        <p className="text-xs text-gray-400 text-center mt-8 leading-relaxed">
          By continuing, you agree to{" "}
          <span className="text-red-600 font-medium">BookMyShow’s Terms of Service</span> and{" "}
          <span className="text-red-600 font-medium">Privacy Policy</span>.
        </p>

        {/* Decorative red line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
      </div>
    </div>
  );
}
