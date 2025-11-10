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
if (!fs.existsSync(postersDir)) fs.mkdirSync(postersDir, { recursive: true });
if (!fs.existsSync(bannerDir)) fs.mkdirSync(bannerDir, { recursive: true });

const upload = multer({ dest: path.join(__dirname, "temp") });

// Database setup
const db = new sqlite3.Database(path.join(__dirname, "data.sqlite"));
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  // Core tables
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY,
    title TEXT,
    duration TEXT,
    description TEXT,
    poster TEXT,
    certificate TEXT,
    language TEXT,
    banner_id TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS cinemas (
    id TEXT PRIMARY KEY,
    name TEXT,
    city TEXT,
    address TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS screens (
    id TEXT PRIMARY KEY,
    cinema_id TEXT,
    name TEXT,
    rows INTEGER,
    cols INTEGER,
    layout_json TEXT DEFAULT '{}',
    FOREIGN KEY(cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS shows (
    id TEXT PRIMARY KEY,
    movie_id TEXT,
    screen_id TEXT,
    show_date TEXT,
    show_time TEXT,
    price INTEGER,
    FOREIGN KEY(movie_id) REFERENCES movies(id),
    FOREIGN KEY(screen_id) REFERENCES screens(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS show_seats (
    show_id TEXT,
    seat_code TEXT,
    status TEXT,
    PRIMARY KEY(show_id, seat_code),
    FOREIGN KEY(show_id) REFERENCES shows(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    movie_id TEXT,
    show_id TEXT,
    seats TEXT,
    amount INTEGER,
    status TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // ✅ Create banners BEFORE any migration touching it
  db.run(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      image TEXT,
      movie_id TEXT,
      FOREIGN KEY(movie_id) REFERENCES movies(id)
    )
  `);

  // --- MIGRATIONS (safe, idempotent) ---
  db.all(`PRAGMA table_info(movies)`, [], (err, cols) => {
    if (err) console.error("❌ Failed to read movies schema:", err);
    const hasBannerId = cols?.some((c) => c.name === "banner_id");
    if (!hasBannerId) {
      db.run(`ALTER TABLE movies ADD COLUMN banner_id TEXT`, (alterErr) => {
        if (alterErr) console.error("⚠️ Migration (movies.banner_id):", alterErr.message);
        else console.log("🛠️ Added 'banner_id' column to movies table");
      });
    }
  });

  db.all(`PRAGMA table_info(banners)`, [], (err, cols) => {
    if (err) console.error("❌ Failed to read banners schema:", err);
    const hasMovieId = cols?.some((c) => c.name === "movie_id");
    if (!hasMovieId) {
      db.run(`ALTER TABLE banners ADD COLUMN movie_id TEXT`, (alterErr) => {
        if (alterErr) console.error("⚠️ Migration (banners.movie_id):", alterErr.message);
        else console.log("🛠️ Added 'movie_id' column to banners table");
      });
    }
  });

  // default admin
  db.get("SELECT * FROM admins WHERE username=?", ["admin"], (err, row) => {
    if (!row) {
      const hash = bcrypt.hashSync("admin123", 10);
      db.run("INSERT INTO admins (username,password) VALUES (?,?)", [
        "admin",
        hash,
      ]);
    }
  });

  // seed cinema/screen if empty
  db.get("SELECT COUNT(*) as c FROM cinemas", (e, r) => {
    if (r && r.c === 0) {
      const cid = nanoid(8);
      db.run(
        "INSERT INTO cinemas (id,name,city,address) VALUES (?,?,?,?)",
        [cid, "Central Multiplex", "Chennai", "T Nagar"]
      );
      const sid = nanoid(8);
      const layout = JSON.stringify({
        aisles: [6],
        premiumRows: ["E", "F"],
        reclinerRows: ["A"],
        disabledSeats: ["A1", "A2"],
      });
      db.run(
        "INSERT INTO screens (id,cinema_id,name,rows,cols,layout_json) VALUES (?,?,?,?,?,?)",
        [sid, cid, "Screen 1", 6, 12, layout]
      );
      console.log("✅ Seeded cinema/screen:", cid, sid);
    }
  });
});

// --- Auth Helpers ---
function authAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const p = jwt.verify(token, SECRET);
    if (p.role !== "admin") throw new Error("not admin");
    req.user = p;
    next();
  } catch {
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
  db.all(
    "SELECT seat_code,status FROM show_seats WHERE show_id=?",
    [showId],
    (_e, seats) => {
      io.to("show:" + showId).emit("seats", seats);
    }
  );
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
      const token = jwt.sign(
        { sub: id, email, name, role: "user" },
        SECRET,
        { expiresIn: "7d" }
      );
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
    const token = jwt.sign(
      { sub: row.id, email: row.email, name: row.name, role: "user" },
      SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  });
});
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM admins WHERE username=?", [username], (_e, row) => {
    if (!row) return res.status(401).json({ error: "Invalid credentials" });
    if (!bcrypt.compareSync(password, row.password))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign(
      { sub: row.id, username, role: "admin" },
      SECRET,
      { expiresIn: "1d" }
    );
    res.json({ token });
  });
});

// --- ADMIN ROUTES ---
app.post("/api/admin/cinemas", authAdmin, (req, res) => {
  const { name, city, address } = req.body;
  if (!name || !city)
    return res.status(400).json({ error: "name and city required" });
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

app.post("/api/admin/screens", authAdmin, (req, res) => {
  const { cinema_id, name, rows, cols, layout_json } = req.body;
  const id = nanoid(8);
  db.run(
    "INSERT INTO screens (id,cinema_id,name,rows,cols,layout_json) VALUES (?,?,?,?,?,?)",
    [id, cinema_id, name, rows || 6, cols || 12, layout_json || "{}"],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

// ✅ Fix: Add GET route for screens
app.get("/api/screens", (_req, res) => {
  db.all(
    `SELECT s.*, c.name AS cinema_name, c.city 
     FROM screens s 
     LEFT JOIN cinemas c ON s.cinema_id = c.id`,
    [],
    (_e, rows) => res.json(rows || [])
  );
});

// ✅ Movies endpoint (used in admin banner dropdown)
app.get("/api/movies", (_req, res) => {
  db.all("SELECT * FROM movies", [], (_e, rows) => res.json(rows || []));
});

app.post("/api/admin/movies", authAdmin, upload.single("poster"), (req, res) => {
  const { title, duration, description, certificate, language, banner_id } =
    req.body;
  const id = nanoid(8);
  let posterPath = "";
  if (req.file) {
    const ext = path.extname(req.file.originalname) || ".jpg";
    const newName = id + ext;
    fs.renameSync(req.file.path, path.join(postersDir, newName));
    posterPath = "/public/assets/posters/" + newName;
  }
  db.run(
    "INSERT INTO movies (id,title,duration,description,poster,certificate,language,banner_id) VALUES (?,?,?,?,?,?,?,?)",
    [
      id,
      title,
      duration,
      description,
      posterPath,
      certificate || "",
      language || "",
      banner_id || null,
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id });
    }
  );
});

// ✅ Banners
app.post("/api/admin/banners", authAdmin, upload.single("image"), (req, res) => {
  const { title, description, movie_id } = req.body;
  if (!movie_id)
    return res.status(400).json({ error: "Movie selection required" });

  const id = nanoid(8);
  let imagePath = "";
  if (req.file) {
    const ext = path.extname(req.file.originalname) || ".jpg";
    const newName = id + ext;
    fs.renameSync(req.file.path, path.join(bannerDir, newName));
    imagePath = "/public/assets/banners/" + newName;
  }

  db.run(
    `INSERT INTO banners (id,title,description,image,movie_id) VALUES (?,?,?,?,?)`,
    [id, title || "", description || "", imagePath, movie_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, image: imagePath });
    }
  );
});

app.get("/api/banners", (_req, res) => {
  db.all(
    `SELECT b.*, m.title as movie_title FROM banners b 
     LEFT JOIN movies m ON b.movie_id=m.id
     ORDER BY b.rowid DESC`,
    [],
    (_e, rows) => res.json(rows || [])
  );
});

app.delete("/api/admin/banners/:id", authAdmin, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT image FROM banners WHERE id=?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Banner not found" });

    if (row.image) {
      const filePath = path.join(
        __dirname,
        row.image.replace(/^\/public\//, "public/")
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.run(`DELETE FROM banners WHERE id=?`, [id], (delErr) => {
      if (delErr) return res.status(500).json({ error: delErr.message });
      res.json({ success: true });
    });
  });
});

// ✅ Cinemas
app.get("/api/cinemas", (req, res) => {
  db.all("SELECT * FROM cinemas", [], (_e, rows) => res.json(rows || []));
});

// --- SERVER ---
const PORT = process.env.PORT || 4000;
http.listen(PORT, () => console.log("✅ Server running on port " + PORT));
