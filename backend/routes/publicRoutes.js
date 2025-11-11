const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/movies", (_req, res) => {
  db.all("SELECT * FROM movies", [], (_e, rows) => res.json(rows || []));
});

router.get("/cinemas", (_req, res) => {
  db.all("SELECT * FROM cinemas", [], (_e, rows) => res.json(rows || []));
});

router.get("/banners", (_req, res) => {
  db.all(`SELECT b.*, m.title AS movie_title FROM banners b LEFT JOIN movies m ON b.movie_id=m.id ORDER BY b.rowid DESC`, [], (_e, rows) => res.json(rows || []));
});

router.get("/shows", (req, res) => {
  const movieId = req.query.movie_id;
  db.all(
    `SELECT shows.*, movies.title AS movie_title, cinemas.name AS cinema_name, cinemas.city AS cinema_city, screens.name AS screen_name
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

router.get("/shows/:id", (req, res) => {
  const id = req.params.id;
  db.get(
    `SELECT s.*, m.title AS movie_title, c.name AS cinema_name, sc.name AS screen_name, sc.rows, sc.cols, sc.layout_json
     FROM shows s
     LEFT JOIN movies m ON s.movie_id = m.id
     LEFT JOIN screens sc ON s.screen_id = sc.id
     LEFT JOIN cinemas c ON sc.cinema_id = c.id
     WHERE s.id=?`,
    [id],
    (err, show) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!show) return res.status(404).json({ error: "Show not found" });
      db.all("SELECT seat_code,status FROM show_seats WHERE show_id=?", [id], (_e, seats) => {
        show.seats = seats;
        res.json(show);
      });
    }
  );
});

router.get("/screens", (_req, res) => {
  db.all(
    `SELECT s.*, c.name AS cinema_name, c.city AS cinema_city
     FROM screens s
     LEFT JOIN cinemas c ON s.cinema_id = c.id`,
    [],
    (_e, rows) => res.json(rows || [])
  );
});

router.get("/movies/:id/booked-seats", (req, res) => {
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

module.exports = router;