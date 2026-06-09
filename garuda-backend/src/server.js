const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const http = require("http");
const { initSocket } = require("./config/socket");

dotenv.config();

/* =========================
   GARUDA BOOT SEQUENCE
========================= */
console.log(`
🦅  GARUDA BACKEND BOOTING...
────────────────────────────────
`);

connectDB();

/* =========================
   CREATE EXPRESS APP
========================= */
const app = express();

/* =========================
   GLOBAL MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("🦅 GARUDA Backend Running 🚀");
});

/* =========================
   ROUTES
========================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/group", require("./routes/group"));

/* =========================
   CREATE HTTP SERVER
========================= */
const server = http.createServer(app);

/* =========================
   SOCKET.IO INITIALIZATION
========================= */
initSocket(server);

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🚀  GARUDA SERVER ONLINE
────────────────────────────────
🌍  Environment : ${process.env.NODE_ENV || "development"}
📡  HTTP Server : http://localhost:${PORT}
🔌  Socket.IO   : ENABLED
🛡️  Auth        : JWT Enabled
📦  Database    : MongoDB Connected
────────────────────────────────
`);
});
