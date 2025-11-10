// src/api.js
import axios from "axios";

// ❗ Leave baseURL blank if you have a Vite proxy like '/api' → 'http://localhost:4000'
// Otherwise, set it explicitly to 'http://localhost:4000'
export const api = axios.create({
  baseURL: "", // or "http://localhost:4000"
});

// ✅ Sets or clears the default Authorization header
export function setAuth(token) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// ✅ Retrieve saved token
export function getToken() {
  return localStorage.getItem("token");
}

// ✅ Remove token + clear header + notify app (Nav will refresh)
export function clearAuth() {
  localStorage.removeItem("token");
  delete api.defaults.headers.common["Authorization"];
  window.dispatchEvent(new Event("storage"));
}
