import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    name: {
      type: String,
      default: ""
    },
    avatar: {
      type: String,
      default: ""
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Never leak internal identifiers to the client.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    avatar: this.avatar
  };
};

export default mongoose.model("User", userSchema);
