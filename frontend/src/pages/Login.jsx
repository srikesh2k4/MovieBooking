// src/components/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState({}); // { login: false, register: false }

  const togglePass = (form) => {
    setShowPass((prev) => ({ ...prev, [form]: !prev[form] }));
  };

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
        window.dispatchEvent(new Event("storage"));
        navigate("/");
      } else {
        alert("Login failed.");
      }
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
        window.dispatchEvent(new Event("storage"));
        navigate("/");
      } else {
        alert("Registration failed.");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-white px-4 py-10">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 md:p-10 relative overflow-hidden border border-gray-100">
        {/* NEON TOP BAR - KEPT */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 shadow-lg shadow-cyan-500/50 animate-pulse"></div>

        {/* HEADER - NEON TITLE */}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 drop-shadow-lg">
              BookMyShow
            </span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in or create an account to continue
          </p>
        </div>

        {/* ANIMATED SLIDER */}
        <div className="relative overflow-hidden rounded-xl">
          <div
            className={`flex transition-transform duration-500 ease-in-out ${
              isLogin ? "translate-x-0" : "-translate-x-1/2"
            }`}
            style={{ width: "200%" }}
          >
            {/* ============ LOGIN FORM ============ */}
            <form onSubmit={onLogin} className="w-1/2 px-4 space-y-5">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                User Login
              </h3>

              <CleanInput label="Email" name="email" type="email" />
              <PasswordInput
                label="Password"
                name="password"
                form="login"
                show={showPass.login}
                toggle={() => togglePass("login")}
              />

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
              >
                Login
              </button>
            </form>

            {/* ============ REGISTER FORM ============ */}
            <form onSubmit={onRegister} className="w-1/2 px-4 space-y-5">
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500">
                Register
              </h3>

              <CleanInput label="Full Name" name="name" type="text" />
              <CleanInput label="Email" name="email" type="email" />
              <PasswordInput
                label="Password"
                name="password"
                form="register"
                show={showPass.register}
                toggle={() => togglePass("register")}
              />

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* TOGGLE BUTTON - NEON TEXT */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-cyan-500 hover:to-pink-500 transition-all duration-300 underline"
          >
            {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>

        {/* FOOTER NOTE - NEON LINKS */}
        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          By continuing, you agree to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 font-medium">
            BookMyShow’s Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-500 font-medium">
            Privacy Policy
          </span>.
        </p>
      </div>
    </div>
  );
}

// ============ CLEAN INPUT (NO NEON) ============
function CleanInput({ label, name, type }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required
        className="mt-1 w-full bg-gray-50 border border-gray-300 rounded-md p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
      />
    </label>
  );
}

// ============ PASSWORD INPUT (NO NEON GLOW, BUT EYE + DOTS) ============
function PasswordInput({ label, name, form, show, toggle }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <div className="relative mt-1">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
        />

        {/* NEON DOTS (only when hidden & typing) */}
        {!show && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-1">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-r from-pink-500 to-cyan-500 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* SHOW/HIDE EYE - NEON COLOR */}
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-500 transition-all duration-300"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-all duration-300 ${show ? "text-cyan-500" : "text-pink-500"}`}
          >
            {show ? (
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <path d="M3 3l18 18" />
              </>
            )}
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </label>
  );
}