// client/src/main.jsx or client/src/index.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Admin from "./pages/Admin.jsx";
import Movie from "./pages/Movie.jsx";
import Checkout from "./pages/Checkout.jsx";
import Ticket from "./pages/Ticket.jsx";
import Nav from "./components/Nav.jsx"; // ✅ import here
import { AuthProvider } from "./AuthContext.jsx";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <main className="min-h-[calc(100vh-64px)] bg-bms-gray dark:bg-gray-950 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my" element={<MyBookings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/movie/:id" element={<Movie />} />
            <Route path="/checkout/:bookingId" element={<Checkout />} />
            <Route path="/ticket/:bookingId" element={<Ticket />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
