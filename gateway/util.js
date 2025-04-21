const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ JWT Verification Middleware
function verifyJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

module.exports = {
  verifyJWT
};