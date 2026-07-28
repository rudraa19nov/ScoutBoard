# Scoutboard — MERN Edition

A LeetCode profile explorer, **MongoDB + Express + React + Node** application
Search any LeetCode username to pull up a scout card of their rank, contest rating,
and solved-problem breakdown, sign in with Google, and keep your own private board of the accounts
you're tracking — every board is scoped to your Google account, so different users never see each
other's saved profiles, tags, or notes.

## Stack

| Layer     | Tech                                                                 |
|-----------|-----------------------------------------------------------------------|
| Frontend  | React 19 (Vite), React Router, plain CSS (no Tailwind/UI kit)         |
| Backend   | Node.js + Express                                                     |
| Database  | MongoDB (Mongoose)                                                    |
| Auth      | Google Identity Services (Sign in with Google) + JWT session cookie   |

## Project layout

```
mern-scoutboard/
  server/                Express API
    src/
      config/            MongoDB connection, Google token verification
      middleware/         auth.js — attaches req.user, scopes every query
      models/             User, SavedProfile (owner-scoped)
      routes/              auth, leetcode (public proxy), board (per-user CRUD)
      services/            leetcode.service.js — GraphQL proxy to leetcode.com
      utils/               JWT helpers, env checker
      index.js             app entry point
  client/                 React SPA (Vite)
    src/
      api/client.js         fetch wrapper (always sends credentials)
      context/AuthContext   current user, login/logout
      hooks/useGoogleButton Google Sign-In button renderer
      components/           SearchBar, ScoutCard, DifficultyBar, Navbar,
                            BoardControls, CompareModal, ProtectedRoute
      pages/                Login, Dashboard
      styles/               design tokens + base styles
```

## Features

- **Google OAuth sign-in** — no passwords to manage. Session is a JWT stored in an httpOnly cookie.
- **Per-user boards** — every saved profile is tied to your Google account (`owner` field +
  a unique `owner + username` index in MongoDB). One account can never read or modify another
  account's board.
- **LeetCode scout cards** — rank, contest rating, easy/medium/hard solved bars, badges, about-me.
- **Tags & private notes** — label pinned profiles (Watching / Target / Rival / Mentor) and attach
  a short scouting note, saved per entry.
- **Stat refresh** — re-pull a pinned profile's latest LeetCode stats on demand instead of only
  caching the numbers from when it was saved.
- **Sort your board** — by recently saved, global rank, contest rating, or total solved.
- **Head-to-head compare** — select any two board entries and see a side-by-side stat comparison.
- **CSV export** — download your board as a spreadsheet-ready CSV.

## 1. Prerequisites

- Node.js 18+
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A Google Cloud project with an OAuth Client ID (steps below)

## 2. Create a Google OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a project (or select an existing one).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
4. Application type: **Web application**.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (Vite dev server)
   - your production frontend URL, once deployed
6. You do **not** need a redirect URI for this flow — Google Identity Services renders a button
   that returns a signed credential directly to the page.
7. Copy the generated **Client ID** (looks like `xxxx.apps.googleusercontent.com`). You'll use the
   same value in both `server/.env` and `client/.env`.

## 3. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/scoutboard   # or your Atlas connection string
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
JWT_SECRET=<generate one — see command below>
```

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Install and run:

```bash
npm install
npm run dev        # nodemon, http://localhost:5000
```

Visit `http://localhost:5000/api/health` — you should see `{"ok":true}`.

## 4. Configure the frontend

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```
VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com   # same Client ID as the server
VITE_API_URL=http://localhost:5000/api
```

Install and run:

```bash
npm install
npm run dev        # http://localhost:5173
```

Open `http://localhost:5173`, sign in with Google, and start scanning usernames.

## 5. How the data separation works

- `POST /api/auth/google` verifies the Google credential server-side (`google-auth-library`),
  upserts a `User` document keyed on Google's `sub` (the stable Google account ID), and issues a
  JWT session cookie.
- Every request to `/api/board/*` runs through `requireAuth` middleware, which decodes that cookie
  and loads the matching `User` as `req.user`.
- Every Mongoose query in `board.routes.js` filters on `{ owner: req.user._id, ... }` — there is no
  code path that returns or mutates a `SavedProfile` document belonging to a different user.
- A compound unique index on `{ owner, username }` stops a user from pinning the same account
  twice, while still letting two different users each pin the same LeetCode username independently.

## 6. Deployment notes

- Set `NODE_ENV=production` on the server — this makes the session cookie `secure` and
  `sameSite: none`, which is required once frontend and backend are on different domains over HTTPS.
- Update `CLIENT_ORIGIN` (server) and `VITE_API_URL` (client) to your deployed URLs.
- Add your production frontend origin to the Google Cloud OAuth client's **Authorized JavaScript
  origins**.
- Build the frontend with `npm run build` inside `client/` and serve the static `dist/` folder from
  any static host (Vercel, Netlify, S3 + CloudFront, or Express's `express.static`).

## Notes on the LeetCode data source

LeetCode's public GraphQL endpoint doesn't allow direct browser requests, so the Express server
proxies the request — this logic is a direct port of the original Next.js API route, unchanged.
Rate limiting (`express-rate-limit`) is applied to all `/api` routes to keep usage reasonable.
