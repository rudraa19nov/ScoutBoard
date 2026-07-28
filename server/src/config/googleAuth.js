import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google Identity Services credential (a signed JWT id_token)
 * that the React client receives from Google's Sign In With Google button.
 * Returns the verified payload (sub, email, name, picture) or throws.
 */
export async function verifyGoogleCredential(credential) {
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google credential payload.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || "",
    avatar: payload.picture || ""
  };
}
