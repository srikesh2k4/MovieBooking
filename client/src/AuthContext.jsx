import React, { createContext, useContext, useEffect, useState } from "react";
import jwtDecode from "jwt-decode";

const AuthContext = createContext();

// ✅ Provider to wrap around your app (in main.jsx)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // --- Restore user on refresh or reload ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.sub,
            name: decoded.name || decoded.username || "User",
            email: decoded.email || "",
            role: decoded.role || "user",
            token,
          });
        } else {
          localStorage.removeItem("token"); // expired
        }
      } catch (err) {
        console.error("Invalid token:", err);
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
    setUser(null);
  };

  // --- Listen for login/logout changes across tabs ---
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

// --- Hook for use in components ---
export const useAuth = () => useContext(AuthContext);
