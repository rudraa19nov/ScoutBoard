import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import leetcodeRoutes from "./routes/leetcode.routes.js";
import boardRoutes from "./routes/board.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true // required so the session cookie is sent with requests
  })
);

// Basic protection against brute-forcing the auth/leetcode endpoints.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/leetcode", leetcodeRoutes);
app.use("/api/board", boardRoutes);

// 404 fallback for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Unexpected server error." });
});

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`[server] Scoutboard API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
      console.error("[server] failed to start:");
      console.error(err);    process.exit(1);
  }
}

start();
