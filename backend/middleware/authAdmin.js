const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET || "supersecret-demo";

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

module.exports = authAdmin;