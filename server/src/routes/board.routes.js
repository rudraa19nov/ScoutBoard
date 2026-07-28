import { Router } from "express";
import SavedProfile from "../models/SavedProfile.js";
import { requireAuth } from "../middleware/auth.js";
import {
  getLeetCodeProfile,
  LeetCodeNotFoundError,
  LeetCodeUpstreamError
} from "../services/leetcode.service.js";

const router = Router();

// Every route below requires a signed-in user, and every database query
// filters on `owner: req.user._id` — this is the whole mechanism by which
// one Google account's board is kept separate from every other account's.
router.use(requireAuth);

const SORTABLE = {
  recent: { createdAt: -1 },
  rank: { "snapshot.ranking": 1 },
  rating: { "snapshot.contest.rating": -1 },
  solved: { "snapshot.solved.all.solved": -1 }
};

// GET /api/board?sort=recent|rank|rating|solved
router.get("/", async (req, res) => {
  const sortKey = SORTABLE[req.query.sort] ? req.query.sort : "recent";
  const entries = await SavedProfile.find({ owner: req.user._id }).sort(SORTABLE[sortKey]);
  return res.json({ entries: entries.map((e) => e.toPublicJSON()) });
});

// POST /api/board  { username }
// Fetches the live profile from LeetCode and pins it to the caller's board.
router.post("/", async (req, res) => {
  const username = (req.body?.username || "").trim();

  if (!username || username.length > 39) {
    return res.status(400).json({ error: "Enter a valid LeetCode username." });
  }

  try {
    const existing = await SavedProfile.findOne({ owner: req.user._id, username });
    if (existing) {
      return res.status(409).json({ error: `"${username}" is already on your board.` });
    }

    const profile = await getLeetCodeProfile(username);

    const entry = await SavedProfile.create({
      owner: req.user._id,
      username: profile.username,
      snapshot: profile,
      snapshotFetchedAt: new Date()
    });

    return res.status(201).json({ entry: entry.toPublicJSON() });
  } catch (err) {
    if (err instanceof LeetCodeNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    if (err instanceof LeetCodeUpstreamError) {
      return res.status(502).json({ error: "Couldn't reach LeetCode right now. Try again in a moment." });
    }
    console.error("[board] create failed:", err);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

// PATCH /api/board/:id  { tag?, note? }
router.patch("/:id", async (req, res) => {
  const { tag, note } = req.body || {};
  const update = {};

  if (tag !== undefined) {
    if (!SavedProfile.TAGS.includes(tag)) {
      return res.status(400).json({ error: "Invalid tag." });
    }
    update.tag = tag;
  }
  if (note !== undefined) {
    update.note = String(note).slice(0, 500);
  }

  const entry = await SavedProfile.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id }, // owner scope prevents editing another user's entry
    { $set: update },
    { new: true }
  );

  if (!entry) {
    return res.status(404).json({ error: "Board entry not found." });
  }

  return res.json({ entry: entry.toPublicJSON() });
});

// POST /api/board/:id/refresh — re-pull the latest stats from LeetCode
router.post("/:id/refresh", async (req, res) => {
  const entry = await SavedProfile.findOne({ _id: req.params.id, owner: req.user._id });
  if (!entry) {
    return res.status(404).json({ error: "Board entry not found." });
  }

  try {
    const profile = await getLeetCodeProfile(entry.username);
    entry.snapshot = profile;
    entry.snapshotFetchedAt = new Date();
    await entry.save();
    return res.json({ entry: entry.toPublicJSON() });
  } catch (err) {
    if (err instanceof LeetCodeNotFoundError) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(502).json({ error: "Couldn't refresh from LeetCode right now." });
  }
});

// DELETE /api/board/:id
router.delete("/:id", async (req, res) => {
  const result = await SavedProfile.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!result) {
    return res.status(404).json({ error: "Board entry not found." });
  }
  return res.json({ ok: true });
});

// GET /api/board/export/csv — download the caller's board as a CSV file
router.get("/export/csv", async (req, res) => {
  const entries = await SavedProfile.find({ owner: req.user._id }).sort({ createdAt: -1 });

  const header = ["username", "realName", "rank", "contestRating", "solvedTotal", "easy", "medium", "hard", "tag", "note"];
  const rows = entries.map((e) => {
    const p = e.snapshot || {};
    const solved = p.solved || {};
    return [
      p.username || e.username,
      p.realName || "",
      p.ranking ?? "",
      p.contest?.rating ?? "",
      solved.all?.solved ?? "",
      solved.easy?.solved ?? "",
      solved.medium?.solved ?? "",
      solved.hard?.solved ?? "",
      e.tag,
      (e.note || "").replace(/[\r\n,]+/g, " ")
    ];
  });

  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=scoutboard.csv");
  return res.send(csv);
});

export default router;
