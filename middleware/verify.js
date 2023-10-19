const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send("Access denied.");

  try {
    const verification = jwt.verify(token, process.env.SECRET_TOKEN);
    req.user = verification;
    next();
  } catch {
    res.status(400).send("Invalid token.");
  }
}

module.exports = auth;
