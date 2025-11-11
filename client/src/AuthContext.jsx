import React, { createContext, useContext, useEffect, useState } from "react";
import jwtDecode from "jwt-decode";
import { api, setAuth } from "./api"; // ✅ ensures API calls include token

// Create context
const AuthContext = createContext();

// ✅ Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // --- Restore user session on refresh ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setAuth(token); // attach token to axios
          setUser({
            id: decoded.sub,
            name: decoded.name || decoded.username || "User",
            email: decoded.email || "",
            role: decoded.role || "user",
            token,
          });
        } else {
          console.warn("Token expired — logging out");
          localStorage.removeItem("token");
        }
      } catch (err) {
        console.error("Invalid token on restore:", err);
        localStorage.removeItem("token");
      }
    }
  }, []);

  // --- Login ---
  const login = (token) => {
    if (!token) return;
    try {
      const decoded = jwtDecode(token);
      localStorage.setItem("token", token);
      setAuth(token); // ✅ makes API auto-authenticated
      setUser({
        id: decoded.sub,
        name: decoded.name || decoded.username || "User",
        email: decoded.email || "",
        role: decoded.role || "user",
        token,
      });
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  };

  // --- Logout ---
  const logout = () => {
    localStorage.removeItem("token");
    setAuth(null); // remove from axios
    setUser(null);
  };

  // --- Sync login/logout across tabs ---
  useEffect(() => {
    const syncAuth = (e) => {
      if (e.key === "token") {
        const newToken = e.newValue;
        if (newToken) {
          login(newToken);
        } else {
          logout();
        }
      }
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook for components ---
export const useAuth = () => useContext(AuthContext);
