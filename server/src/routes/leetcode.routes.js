import { Router } from "express";
import {
  getLeetCodeProfile,
  LeetCodeNotFoundError,
  LeetCodeUpstreamError
} from "../services/leetcode.service.js";

const router = Router();

function isValidUsername(username) {
  return typeof username === "string" && username.length > 0 && username.length <= 39;
}

// GET /api/leetcode/:username
// Public lookup used by the search bar. Does not require sign-in and does
// not touch the database — it's a pure read-through proxy to LeetCode.
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: "Enter a valid LeetCode username." });
  }

  try {
    const profile = await getLeetCodeProfile(username);
    return res.json({ profile });
  } catch (err) {
    if (err instanceof LeetCodeNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof LeetCodeUpstreamError) {
      console.error("[leetcode] upstream error:", err.message);
      return res.status(502).json({ error: "Couldn't reach LeetCode right now. Try again in a moment." });
    }
    console.error("[leetcode] unexpected error:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

export default router;
