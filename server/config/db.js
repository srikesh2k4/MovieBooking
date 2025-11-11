const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const db = new sqlite3.Database(path.join(__dirname, "../data.sqlite"));

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

  // Migration: ensure pdf_path exists
  db.all(`PRAGMA table_info(bookings)`, [], (err, cols) => {
    if (err) console.error("Failed to read bookings schema:", err);
    const hasPdf = cols?.some((c) => c.name === "pdf_path");
    if (!hasPdf) {
      db.run(`ALTER TABLE bookings ADD COLUMN pdf_path TEXT`, (alterErr) => {
        if (alterErr)
          console.error("Migration (bookings.pdf_path):", alterErr.message);
        else console.log("Added 'pdf_path' column to bookings table");
      });
    }
  });
});

module.exports = db;