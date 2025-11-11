const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret-demo";

router.post("/register", (req, res) => {
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

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email=?", [email], (_e, row) => {
    if (!row || !bcrypt.compareSync(password, row.password))
      return res.status(401).json({ error: "Invalid credentials" });

    const payload = {
      sub: row.id,
      email: row.email,
      name: row.name || "User",
      role: "user",
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: "7d" });

    res.json({
      message: "Login successful",
      user: { id: row.id, name: row.name, email: row.email },
      token,
    });
  });
});


module.exports = router;