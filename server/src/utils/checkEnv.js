import "dotenv/config";

const required = ["MONGODB_URI", "GOOGLE_CLIENT_ID", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Copy server/.env.example to server/.env and fill in the values.");
  process.exit(1);
} else {
  console.log("All required environment variables are set.");
}
