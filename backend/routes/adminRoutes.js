const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { nanoid } = require("nanoid");
const authAdmin = require("../middleware/authAdmin");
const upload = require("../config/multerConfig");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret-demo";
const postersDir = path.join(__dirname, "../public/assets/posters");
const bannerDir = path.join(__dirname, "../public/assets/banners");

// Ensure dirs
if (!fs.existsSync(postersDir)) fs.mkdirSync(postersDir, { recursive: true });
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admins WHERE username=?", [username], (_e, row) => {
    if (!row || !bcrypt.compareSync(password, row.password))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ sub: row.id, username, role: "admin" }, SECRET, { expiresIn: "1d" });
    res.json({ token });
  });
});

router.post("/cinemas", authAdmin, (req, res) => {
  const { name, city, address } = req.body;
  if (!name || !city) return res.status(400).json({ error: "Missing name or city" });
  const id = nanoid(8);
  db.run(
    "INSERT INTO cinemas (id,name,city,address) VALUES (?,?,?,?)",
    [id, name, city, address || ""],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

router.post("/movies", authAdmin, upload.single("poster"), (req, res) => {
  const { title, duration, description, certificate, language } = req.body;
  const id = nanoid(8);
  let posterPath = "";
  if (req.file) {
    const ext = path.extname(req.file.originalname) || ".jpg";
    const newName = id + ext;
    fs.renameSync(req.file.path, path.join(postersDir, newName));
    posterPath = `/public/assets/posters/${newName}`;
  }
  db.run(
    "INSERT INTO movies (id,title,duration,description,poster,certificate,language) VALUES (?,?,?,?,?,?,?)",
    [id, title, duration, description, posterPath, certificate || "", language || ""],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

router.post("/shows", authAdmin, (req, res) => {
  const { movie_id, screen_id, show_date, show_time, price } = req.body;
  const id = nanoid(8);
  db.get("SELECT rows,cols,layout_json FROM screens WHERE id=?", [screen_id], (_e, sc) => {
    if (!sc) return res.status(404).json({ error: "screen not found" });
    db.run(
      "INSERT INTO shows (id,movie_id,screen_id,show_date,show_time,price) VALUES (?,?,?,?,?,?)",
      [id, movie_id, screen_id, show_date, show_time, price || 180],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        const layout = JSON.parse(sc.layout_json || "{}");
        const disabled = new Set(layout.disabledSeats || []);
        const stmt = db.prepare("INSERT INTO show_seats (show_id,seat_code,status) VALUES (?,?,?)");
        for (let r = 0; r < sc.rows; r++) {
          for (let c = 1; c <= sc.cols; c++) {
            const seat = String.fromCharCode(65 + r) + c;
            const status = disabled.has(seat) ? "sold" : "available";
            stmt.run(id, seat, status);
          }
        }
        stmt.finalize(() => {
          global.emitSeatUpdate(id);
          res.json({ id });
        });
      }
    );
  });
});

router.post("/banners", authAdmin, upload.single("image"), (req, res) => {
  try {
    const { title, description, movie_id } = req.body;
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    const id = nanoid(8);
    const ext = path.extname(req.file.originalname) || ".jpg";
    const newName = id + ext;
    const newPath = path.join(bannerDir, newName);
    fs.rename(req.file.path, newPath, (err) => {
      if (err) return res.status(500).json({ error: "File move failed: " + err.message });
      const imagePath = `/public/assets/banners/${newName}`;
      db.run(
        "INSERT INTO banners (id, title, description, image, movie_id) VALUES (?,?,?,?,?)",
        [id, title || "", description || "", imagePath, movie_id || null],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ id, image: imagePath });
        }
      );
    });
  } catch (err) {
    console.error("Banner add crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/banners/:id", authAdmin, (req, res) => {
  const id = req.params.id;
  db.get("SELECT image FROM banners WHERE id=?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Banner not found" });
    if (row.image) {
      try {
        const bannerPath = path.join(__dirname, "../", row.image.replace(/^\/public\//, "public/"));
        if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath);
      } catch (fsErr) {
        console.warn("Banner image delete failed:", fsErr.message);
      }
    }
    db.run("DELETE FROM banners WHERE id=?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});

router.delete("/movies/:id", authAdmin, (req, res) => {
  const movieId = req.params.id;
  db.serialize(() => {
    db.all("SELECT id FROM shows WHERE movie_id=?", [movieId], (err, shows) => {
      if (err) return res.status(500).json({ error: err.message });
      const showIds = shows.map((s) => s.id);
      if (showIds.length > 0) {
        const placeholders = showIds.map(() => "?").join(",");
        db.run(`DELETE FROM show_seats WHERE show_id IN (${placeholders})`, showIds);
      }
      db.run("DELETE FROM bookings WHERE movie_id=?", [movieId]);
      db.run("DELETE FROM shows WHERE movie_id=?", [movieId]);
      db.run("DELETE FROM banners WHERE movie_id=?", [movieId]);
      db.get("SELECT poster FROM movies WHERE id=?", [movieId], (err2, row) => {
        if (row && row.poster) {
          try {
            const posterPath = path.join(__dirname, "../", row.poster.replace(/^\/public\//, "public/"));
            if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
          } catch (fsErr) {
            console.warn("Poster delete failed:", fsErr.message);
          }
        }
        db.run("DELETE FROM movies WHERE id=?", [movieId], function (err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          if (this.changes === 0) return res.status(404).json({ error: "Movie not found" });
          res.json({ success: true });
        });
      });
    });
  });
});

// ————————————————————————————————————————
// NEW: DELETE CINEMA (cascade)
// ————————————————————————————————————————
router.delete("/cinemas/:id", authAdmin, (req, res) => {
  const cinemaId = req.params.id;

  db.serialize(() => {
    // Get all screen IDs
    db.all("SELECT id FROM screens WHERE cinema_id=?", [cinemaId], (err, screens) => {
      if (err) return res.status(500).json({ error: err.message });

      const screenIds = screens.map(s => s.id);

      if (screenIds.length > 0) {
        const placeholders = screenIds.map(() => "?").join(",");
        // Delete show_seats → bookings → shows → screens
        db.run(`DELETE FROM show_seats WHERE show_id IN (SELECT id FROM shows WHERE screen_id IN (${placeholders}))`, screenIds);
        db.run(`DELETE FROM bookings WHERE show_id IN (SELECT id FROM shows WHERE screen_id IN (${placeholders}))`, screenIds);
        db.run(`DELETE FROM shows WHERE screen_id IN (${placeholders})`, screenIds);
      }

      // Delete screens
      db.run("DELETE FROM screens WHERE cinema_id=?", [cinemaId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Finally delete cinema
        db.run("DELETE FROM cinemas WHERE id=?", [cinemaId], function (err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          if (this.changes === 0) return res.status(404).json({ error: "Cinema not found" });
          res.json({ success: true });
        });
      });
    });
  });
});

// ————————————————————————————————————————
// NEW: DELETE SCREEN (cascade)
// ————————————————————————————————————————
router.delete("/screens/:id", authAdmin, (req, res) => {
  const screenId = req.params.id;

  db.serialize(() => {
    // Get all show IDs
    db.all("SELECT id FROM shows WHERE screen_id=?", [screenId], (err, shows) => {
      if (err) return res.status(500).json({ error: err.message });

      const showIds = shows.map(s => s.id);

      if (showIds.length > 0) {
        const placeholders = showIds.map(() => "?").join(",");
        db.run(`DELETE FROM show_seats WHERE show_id IN (${placeholders})`, showIds);
        db.run(`DELETE FROM bookings WHERE show_id IN (${placeholders})`, showIds);
      }

      // Delete shows
      db.run("DELETE FROM shows WHERE screen_id=?", [screenId], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Delete screen
        db.run("DELETE FROM screens WHERE id=?", [screenId], function (err3) {
          if (err3) return res.status(500).json({ error: err3.message });
          if (this.changes === 0) return res.status(404).json({ error: "Screen not found" });
          res.json({ success: true });
        });
      });
    });
  });
});

module.exports = router;