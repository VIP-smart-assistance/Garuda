const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 FETCH FULL USER
    const user = await User.findById(decoded.id).select("_id name email role");

    if (!user)
      return res.status(401).json({ message: "User not found" });

    req.user = user; // ✅ now has _id, name, email, role
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
