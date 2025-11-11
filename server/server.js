// Express + SQLite + JWT + Socket.IO + uploads + tickets (dynamic layouts)
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const { nanoid } = require("nanoid");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));

const SECRET = process.env.JWT_SECRET || "supersecret-demo";

// Upload directories
const postersDir = path.join(__dirname, "public", "assets", "posters");
const bannerDir = path.join(__dirname, "public", "assets", "banners");
const ticketsDir = path.join(__dirname, "public", "tickets");
if (!fs.existsSync(postersDir)) fs.mkdirSync(postersDir, { recursive: true });
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });
if (!fs.existsSync(ticketsDir)) fs.mkdirSync(ticketsDir, { recursive: true });

const upload = multer({ dest: path.join(__dirname, "temp") });

// Database setup
const db = new sqlite3.Database(path.join(__dirname, "data.sqlite"));
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY, title TEXT, duration TEXT, description TEXT, poster TEXT, certificate TEXT, language TEXT, banner_id TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS cinemas (id TEXT PRIMARY KEY, name TEXT, city TEXT, address TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS screens (
    id TEXT PRIMARY KEY, cinema_id TEXT, name TEXT, rows INTEGER, cols INTEGER, layout_json TEXT DEFAULT '{}',
    FOREIGN KEY(cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS shows (
    id TEXT PRIMARY KEY, movie_id TEXT, screen_id TEXT, show_date TEXT, show_time TEXT, price INTEGER,
    FOREIGN KEY(movie_id) REFERENCES movies(id),
    FOREIGN KEY(screen_id) REFERENCES screens(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS show_seats (
    show_id TEXT, seat_code TEXT, status TEXT,
    PRIMARY KEY(show_id, seat_code),
    FOREIGN KEY(show_id) REFERENCES shows(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY, user_id TEXT, movie_id TEXT, show_id TEXT,
    seats TEXT, amount INTEGER, status TEXT, pdf_path TEXT, created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS banners (
    id TEXT PRIMARY KEY, title TEXT, description TEXT, image TEXT, movie_id TEXT,
    FOREIGN KEY(movie_id) REFERENCES movies(id)
  )`);

  // Default admin
  db.get("SELECT * FROM admins WHERE username=?", ["admin"], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync("admin123", 10);
      db.run("INSERT INTO admins (username,password) VALUES (?,?)", ["admin", hash]);
    }
  });
  // ✅ Migration: ensure pdf_path exists
db.all(`PRAGMA table_info(bookings)`, [], (err, cols) => {
  if (err) console.error("❌ Failed to read bookings schema:", err);
  const hasPdf = cols?.some((c) => c.name === "pdf_path");
  if (!hasPdf) {
    db.run(`ALTER TABLE bookings ADD COLUMN pdf_path TEXT`, (alterErr) => {
      if (alterErr)
        console.error("⚠️ Migration (bookings.pdf_path):", alterErr.message);
      else console.log("🛠️ Added 'pdf_path' column to bookings table");
    });
  }
});

});

function authAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const p = jwt.verify(token, SECRET);
    if (p.role !== "admin") throw new Error("not admin");
    req.user = p;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function authUser(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// --- SOCKET.IO ---
io.on("connection", (socket) => {
  socket.on("joinShow", (id) => socket.join("show:" + id));
});
function emitSeatUpdate(showId) {
  db.all("SELECT seat_code,status FROM show_seats WHERE show_id=?", [showId], (_e, seats) => {
    io.to("show:" + showId).emit("seats", seats);
  });
}

// --- AUTH ROUTES ---
app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  const id = nanoid(10);
  const hash = bcrypt.hashSync(password, 10);
  db.run(
    "INSERT INTO users (id,email,password,name) VALUES (?,?,?,?)",
    [id, email, hash, name || "User"],
    (err) => {
      if (err) return res.status(400).json({ error: "Email already in use" });
      const token = jwt.sign({ sub: id, email, name, role: "user" }, SECRET, { expiresIn: "7d" });
      res.json({ token });
    }
  );
});
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email=?", [email], (_e, row) => {
    if (!row) return res.status(401).json({ error: "Invalid credentials" });
    if (!bcrypt.compareSync(password, row.password))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ sub: row.id, email: row.email, name: row.name, role: "user" }, SECRET, { expiresIn: "7d" });
    res.json({ token });
  });
});
app.get("/api/me", authUser, (req, res) => {
  db.get("SELECT id, email, name FROM users WHERE id=?", [req.user.sub], (_e, row) => {
    res.json(row || {});
  });
});

// --- ADMIN ROUTES ---
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admins WHERE username=?", [username], (_e, row) => {
    if (!row) return res.status(401).json({ error: "Invalid credentials" });
    if (!bcrypt.compareSync(password, row.password))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ sub: row.id, username, role: "admin" }, SECRET, { expiresIn: "1d" });
    res.json({ token });
  });
});
app.post("/api/admin/cinemas", authAdmin, (req, res) => {
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

app.post("/api/admin/movies", authAdmin, upload.single("poster"), (req, res) => {
  const { title, duration, description, certificate, language } = req.body;
  const id = nanoid(8);
  let posterPath = "";
  if (req.file) {
    const ext = path.extname(req.file.originalname) || ".jpg";
    const newName = id + ext;
    fs.renameSync(req.file.path, path.join(postersDir, newName));
    posterPath = "/public/assets/posters/" + newName;
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
// ✅ Get all booked seats across all shows for a movie
app.get("/api/movies/:id/booked-seats", (req, res) => {
  const movieId = req.params.id;

  db.all(
    `SELECT s.id AS show_id, ss.seat_code, ss.status
     FROM show_seats ss
     JOIN shows s ON ss.show_id = s.id
     WHERE s.movie_id=? AND ss.status='sold'`,
    [movieId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});



app.post("/api/admin/shows", authAdmin, (req, res) => {
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
          emitSeatUpdate(id);
          res.json({ id });
        });
      }
    );
  });
});
// ✅ Admin-only Screens
app.get("/api/screens", (_req, res) => {
  db.all(
    `SELECT s.*, c.name AS cinema_name, c.city AS cinema_city
     FROM screens s
     LEFT JOIN cinemas c ON s.cinema_id = c.id`,
    [],
    (_e, rows) => res.json(rows || [])
  );
});


// ✅ Add Screen (Admin only)
app.post("/api/screens", authAdmin, (req, res) => {
  const { cinema_id, name, rows, cols, layout_json } = req.body;

  if (!cinema_id || !name)
    return res.status(400).json({ error: "Missing cinema_id or name" });

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





app.get("/api/shows", (req, res) => {
  const movieId = req.query.movie_id;
  db.all(
    `SELECT shows.*, 
      movies.title AS movie_title, 
      cinemas.name AS cinema_name, 
      cinemas.city AS cinema_city,
      screens.name AS screen_name
     FROM shows
     LEFT JOIN movies ON shows.movie_id = movies.id
     LEFT JOIN screens ON shows.screen_id = screens.id
     LEFT JOIN cinemas ON screens.cinema_id = cinemas.id
     WHERE (? IS NULL OR shows.movie_id = ?)
     ORDER BY show_date, show_time`,
    [movieId || null, movieId || null],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows || []);
    }
  );
});
// ✅ Get single show details
// --- ✅ Fix Movie show details ---
app.get("/api/shows/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT s.*, m.title AS movie_title, c.name AS cinema_name, sc.name AS screen_name,
            sc.rows, sc.cols, sc.layout_json
     FROM shows s
     LEFT JOIN movies m ON s.movie_id = m.id
     LEFT JOIN screens sc ON s.screen_id = sc.id
     LEFT JOIN cinemas c ON sc.cinema_id = c.id
     WHERE s.id=?`,
    [id],
    (err, show) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!show) return res.status(404).json({ error: "Show not found" });

      // Load seats
      db.all(
        "SELECT seat_code,status FROM show_seats WHERE show_id=?",
        [id],
        (_e, seats) => {
          show.seats = seats;
          res.json(show);
        }
      );
    }
  );
});



// --- 🎟️ BOOKING + PAYMENT + PDF ---
app.post("/api/book", authUser, (req, res) => {
  const { show_id, seats } = req.body;
  if (!show_id || !seats?.length)
    return res.status(400).json({ error: "Missing show_id or seats" });

  db.get("SELECT * FROM shows WHERE id=?", [show_id], (err, show) => {
    if (!show) return res.status(404).json({ error: "Show not found" });

    const seatList = seats.join(",");
    const total = show.price * seats.length;
    const id = nanoid(10);
    const created = new Date().toISOString();

    // Mark seats as sold
    const stmt = db.prepare("UPDATE show_seats SET status='sold' WHERE show_id=? AND seat_code=?");
    seats.forEach((s) => stmt.run(show_id, s));
    stmt.finalize(() => emitSeatUpdate(show_id));

    // Create a blank PDF for now (until payment)
    const pdfPath = `/public/tickets/${id}.pdf`;

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

app.post("/api/payment", authUser, (req, res) => {
  const { bookingId, method } = req.body;
  if (!bookingId) return res.status(400).json({ error: "Missing bookingId" });

  db.get(
    `SELECT b.*, 
            m.title AS movie_title, 
            m.poster AS movie_poster,
            s.show_date, s.show_time, 
            c.name AS cinema_name, 
            c.city AS cinema_city
     FROM bookings b
     LEFT JOIN movies m ON b.movie_id = m.id
     LEFT JOIN shows s ON b.show_id = s.id
     LEFT JOIN screens sc ON s.screen_id = sc.id
     LEFT JOIN cinemas c ON sc.cinema_id = c.id
     WHERE b.id=?`,
    [bookingId],
    (err, booking) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      // ✅ PDF path
      const filePath = path.join(__dirname, booking.pdf_path.replace(/^\/public\//, "public/"));
      const doc = new PDFDocument({ size: [420, 300], margin: 20 });
      doc.pipe(fs.createWriteStream(filePath));

      // --- 🎟️ HEADER STRIP ---
      doc.rect(0, 0, 420, 50).fill("#e11d48");
      doc.fillColor("#fff").fontSize(18).text("BookMyShow", 20, 15);
      doc.fontSize(10).text("Official Movie Ticket", 330, 20);

      // --- 🎬 MOVIE POSTER ---
      if (booking.movie_poster) {
        try {
          const posterPath = path.join(__dirname, booking.movie_poster.replace(/^\/public\//, "public/"));
          if (fs.existsSync(posterPath)) {
            doc.image(posterPath, 20, 70, { width: 80, height: 110, fit: [80, 110] });
          } else {
            doc.rect(20, 70, 80, 110).stroke("#ccc");
          }
        } catch {
          doc.rect(20, 70, 80, 110).stroke("#ccc");
        }
      } else {
        doc.rect(20, 70, 80, 110).stroke("#ccc");
      }

      // --- 🎥 MOVIE DETAILS ---
      doc.fontSize(14).fillColor("#111").text(booking.movie_title || "Untitled", 120, 70);
      doc.fontSize(10).fillColor("#333");
      doc.text(`Cinema: ${booking.cinema_name || "N/A"} (${booking.cinema_city || ""})`, 120, 90);
      doc.text(`Date: ${booking.show_date}`, 120, 105);
      doc.text(`Time: ${booking.show_time}`, 120, 120);
      doc.text(`Seats: ${booking.seats}`, 120, 135);
      doc.text(`Amount Paid: ₹${booking.amount}`, 120, 150);
      doc.text(`Payment Method: ${method}`, 120, 165);
      doc.text(`Booking ID: ${booking.id}`, 120, 180, { width: 250 });

      // --- 🎫 TICKET CONFIRMATION BOX ---
      doc.rect(20, 200, 380, 60).stroke("#e11d48");
      doc.fontSize(13).fillColor("#e11d48").text("✔ Confirmed Booking", 140, 210);
      doc.fontSize(10).fillColor("#444").text("Please present this ticket at the entrance.", 100, 230, {
        align: "center",
      });

      // --- ✂️ CUT LINE ---
      doc.moveTo(20, 270).lineTo(400, 270).dash(3, { space: 3 }).stroke("#aaa");

      // --- 📄 FOOTER INFO ---
      doc.undash().fontSize(9).fillColor("#777");
      doc.text("Enjoy your movie! 🍿", 0, 275, { align: "center" });
      doc.text("Powered by Pixel_AI_Labs | Authenticated BookMyShow Digital Ticket", 0, 288, {
        align: "center",
      });

      doc.end();

      // ✅ Update booking status
      db.run("UPDATE bookings SET status='paid' WHERE id=?", [bookingId], (uErr) => {
        if (uErr) return res.status(500).json({ error: uErr.message });
        res.json({ success: true, pdf: `/public/tickets/${bookingId}.pdf` });
      });
    }
  );
});



app.get("/api/my/bookings", authUser, (req, res) => {
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

app.delete("/api/admin/movies/:id", authAdmin, (req, res) => {
  try {
    const movieId = req.params.id;

    db.serialize(() => {
      db.all("SELECT id FROM shows WHERE movie_id=?", [movieId], (err, shows) => {
        if (err) {
          console.error("❌ DB fetch failed:", err.message);
          return res.status(500).json({ error: err.message });
        }

        const showIds = shows.map((s) => s.id);

        // Safely delete related records
        if (showIds.length > 0) {
          const placeholders = showIds.map(() => "?").join(",");
          db.run(`DELETE FROM show_seats WHERE show_id IN (${placeholders})`, showIds, (seatErr) => {
            if (seatErr) console.warn("⚠️ show_seats delete issue:", seatErr.message);
          });
        }

        db.run("DELETE FROM bookings WHERE movie_id=?", [movieId]);
        db.run("DELETE FROM shows WHERE movie_id=?", [movieId]);
        db.run("DELETE FROM banners WHERE movie_id=?", [movieId]);

        db.get("SELECT poster FROM movies WHERE id=?", [movieId], (err2, row) => {
          if (row && row.poster) {
            try {
              const posterPath = path.join(__dirname, row.poster.replace(/^\/public\//, "public/"));
              if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
            } catch (fsErr) {
              console.warn("⚠️ Poster delete failed:", fsErr.message);
            }
          }

          db.run("DELETE FROM movies WHERE id=?", [movieId], function (err3) {
            if (err3) {
              console.error("❌ Final delete failed:", err3.message);
              return res.status(500).json({ error: err3.message });
            }
            if (this.changes === 0)
              return res.status(404).json({ error: "Movie not found" });
            res.json({ success: true });
          });
        });
      });
    });
  } catch (e) {
    console.error("💥 Server crash prevented:", e.message);
    res.status(500).json({ error: "Unexpected server error" });
  }
});




// --- 🖼️ ADD BANNER (Admin Only, Safe) ---
app.post("/api/admin/banners", authAdmin, upload.single("image"), (req, res) => {
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

// --- 🗑️ DELETE BANNER (Admin Only, Safe) ---
// --- 🗑️ DELETE BANNER (Admin Only) ---
app.delete("/api/admin/banners/:id", authAdmin, (req, res) => {
  const id = req.params.id;
  db.get("SELECT image FROM banners WHERE id=?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Banner not found" });

    // Safely delete image if exists
    if (row.image) {
      try {
        const bannerPath = path.join(__dirname, row.image.replace(/^\/public\//, "public/"));
        if (fs.existsSync(bannerPath)) fs.unlinkSync(bannerPath);
      } catch (fsErr) {
        console.warn("⚠️ Banner image delete failed:", fsErr.message);
      }
    }

    db.run("DELETE FROM banners WHERE id=?", [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ success: true });
    });
  });
});




// --- BANNERS + CINEMAS ---
app.get("/api/banners", (_req, res) => {
  db.all(`SELECT b.*, m.title AS movie_title FROM banners b LEFT JOIN movies m ON b.movie_id=m.id ORDER BY b.rowid DESC`, [], (_e, rows) => res.json(rows || []));
});
app.get("/api/movies", (_req, res) => {
  db.all("SELECT * FROM movies", [], (_e, rows) => res.json(rows || []));
});
app.get("/api/cinemas", (_req, res) => {
  db.all("SELECT * FROM cinemas", [], (_e, rows) => res.json(rows || []));
});

// --- SERVER ---
const PORT = process.env.PORT || 4000;
http.listen(PORT, () => console.log("✅ Server running on port " + PORT));
