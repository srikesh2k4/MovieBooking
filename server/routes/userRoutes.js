const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { nanoid } = require("nanoid");
const authUser = require("../middleware/authUser");
const { generateTicketPDF } = require("../utils/pdfGenerator");
const path = require("path");
const fs = require("fs");

const ticketsDir = path.join(__dirname, "../public/tickets");
if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });

router.get("/me", authUser, (req, res) => {
  db.get("SELECT id, email, name FROM users WHERE id=?", [req.user.sub], (_e, row) => {
    res.json(row || {});
  });
});

router.post("/book", authUser, (req, res) => {
  const { show_id, seats } = req.body;
  if (!show_id || !seats?.length) return res.status(400).json({ error: "Missing show_id or seats" });

  db.get("SELECT * FROM shows WHERE id=?", [show_id], (err, show) => {
    if (!show) return res.status(404).json({ error: "Show not found" });
    const seatList = seats.join(",");
    const total = show.price * seats.length;
    const id = nanoid(10);
    const created = new Date().toISOString();
    const pdfPath = `/public/tickets/${id}.pdf`;

    const stmt = db.prepare("UPDATE show_seats SET status='sold' WHERE show_id=? AND seat_code=?");
    seats.forEach((s) => stmt.run(show_id, s));
    stmt.finalize(() => global.emitSeatUpdate(show_id));

    db.run(
      "INSERT INTO bookings (id,user_id,movie_id,show_id,seats,amount,status,pdf_path,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, req.user.sub, show.movie_id, show_id, seatList, total, "pending", pdfPath, created],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ bookingId: id });
      }
    );
  });
});

router.post("/payment", authUser, async (req, res) => {
  const { bookingId, method } = req.body;
  if (!bookingId) return res.status(400).json({ error: "Missing bookingId" });

  db.get(
    `SELECT b.*, m.title AS movie_title, m.poster AS movie_poster, s.show_date, s.show_time, c.name AS cinema_name, c.city AS cinema_city
     FROM bookings b
     LEFT JOIN movies m ON b.movie_id = m.id
     LEFT JOIN shows s ON b.show_id = s.id
     LEFT JOIN screens sc ON s.screen_id = sc.id
     LEFT JOIN cinemas c ON sc.cinema_id = c.id
     WHERE b.id=?`,
    [bookingId],
    async (err, booking) => {
      if (err || !booking) return res.status(404).json({ error: "Booking not found" });

      const filePath = path.join(ticketsDir, `${bookingId}.pdf`);
      try {
        await generateTicketPDF({ ...booking, method }, filePath);
        db.run("UPDATE bookings SET status='paid' WHERE id=?", [bookingId], (uErr) => {
          if (uErr) return res.status(500).json({ error: uErr.message });
          res.json({ success: true, pdf: `/public/tickets/${bookingId}.pdf` });
        });
      } catch (pdfErr) {
        res.status(500).json({ error: "PDF generation failed" });
      }
    }
  );
});

router.get("/my/bookings", authUser, (req, res) => {
  db.all(
    `SELECT b.*, m.title AS movie_title, s.show_time, s.show_date
     FROM bookings b
     LEFT JOIN movies m ON b.movie_id = m.id
     LEFT JOIN shows s ON b.show_id = s.id
     WHERE b.user_id=? ORDER BY b.created_at DESC`,
    [req.user.sub],
    (_e, rows) => res.json(rows || [])
  );
});

router.post("/screens", require("../middleware/authAdmin"), (req, res) => {
  const { cinema_id, name, rows, cols, layout_json } = req.body;
  if (!cinema_id || !name) return res.status(400).json({ error: "Missing cinema_id or name" });
  const id = nanoid(8);
  db.run(
    "INSERT INTO screens (id, cinema_id, name, rows, cols, layout_json) VALUES (?, ?, ?, ?, ?, ?)",
    [id, cinema_id, name, rows || 0, cols || 0, layout_json || "{}"],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

module.exports = router;