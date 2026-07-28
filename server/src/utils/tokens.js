import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export function signSessionToken(user) {
  return jwt.sign({ uid: user._id.toString() }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifySessionToken(token) {
  return jwt.verify(token, SECRET); // throws if invalid/expired
}
