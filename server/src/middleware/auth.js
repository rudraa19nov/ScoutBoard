import User from "../models/User.js";
import { verifySessionToken } from "../utils/tokens.js";

const COOKIE_NAME = process.env.COOKIE_NAME || "scoutboard_token";

/**
 * Requires a valid session. Every route protected by this middleware
 * can safely assume req.user is the currently authenticated account,
 * which is what all per-user data scoping is built on.
 */
export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Not signed in." });
    }

    const { uid } = verifySessionToken(token);
    const user = await User.findById(uid);

    if (!user) {
      return res.status(401).json({ error: "Session no longer valid." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid." });
  }
}

/** Attaches req.user if a valid cookie is present, but never blocks the request. */
export async function attachUserIfPresent(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const { uid } = verifySessionToken(token);
    const user = await User.findById(uid);
    if (user) req.user = user;
  } catch {
    // ignore — treated as logged out
  }
  next();
}

export { COOKIE_NAME };
