import mongoose from "mongoose";

const TAGS = ["none", "watching", "target", "rival", "mentor"];

const savedProfileSchema = new mongoose.Schema(
  {
    // Every document is scoped to the Google-authenticated user who saved it.
    // All queries in the routes layer filter by this field, so one user
    // can never see or touch another user's board.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    tag: {
      type: String,
      enum: TAGS,
      default: "none"
    },
    note: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true
    },
    // Cached shape of the last LeetCode fetch so the board can render
    // instantly without re-hitting LeetCode on every page load.
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    snapshotFetchedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// A user can only pin a given username once.
savedProfileSchema.index({ owner: 1, username: 1 }, { unique: true });

savedProfileSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    username: this.username,
    tag: this.tag,
    note: this.note,
    profile: this.snapshot,
    fetchedAt: this.snapshotFetchedAt,
    savedAt: this.createdAt
  };
};

savedProfileSchema.statics.TAGS = TAGS;

export default mongoose.model("SavedProfile", savedProfileSchema);
