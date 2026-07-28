import { Router } from "express";
import User from "../models/User.js";
import { verifyGoogleCredential } from "../config/googleAuth.js";
import { signSessionToken } from "../utils/tokens.js";
import { requireAuth, COOKIE_NAME } from "../middleware/auth.js";

const router = Router();

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd, // requires HTTPS in production
  sameSite: isProd ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// POST /api/auth/google  { credential }
// Exchanges a Google Identity Services credential for a Scoutboard session.
router.post("/google", async (req, res) => {
  const { credential } = req.body || {};

  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential." });
  }

  try {
    const { googleId, email, name, avatar } = await verifyGoogleCredential(credential);

    const user = await User.findOneAndUpdate(
      { googleId },
      { $set: { email, name, avatar, lastLoginAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = signSessionToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.json({ user: user.toPublicJSON() });
  } catch (err) {
    console.error("[auth] google sign-in failed:", err.message);
    return res.status(401).json({ error: "Could not verify Google sign-in." });
  }
});

// POST /api/auth/logout
router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: req.user.toPublicJSON() });
});

export default router;
