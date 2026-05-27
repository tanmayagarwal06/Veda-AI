# VedaAI

An AI-powered exam paper generator for teachers. Fill in a form — subject, question types, marks — and the AI writes the full paper. You get real-time progress while it generates, then download it as a PDF.

Built to solve a real problem: writing 40-question papers by hand every exam cycle takes forever.

**Live:** [https://frontend-henna-pi-46.vercel.app](https://frontend-henna-pi-46.vercel.app)

---

## How it works

1. Create an assignment — pick your subject, due date, and question mix (MCQ, Short Answer, Long Answer, Numerical, etc.)
2. Submit — the backend queues a BullMQ job and calls the AI (Claude or Gemini)
3. Watch it generate in real-time over WebSocket
4. Get the formatted paper — download as PDF via browser print, or regenerate if you want different questions

---

## Tech stack

- **Frontend** — Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend** — Express, TypeScript, BullMQ (job queue)
- **Database** — MongoDB Atlas
- **Cache / Queue** — Redis (Upstash in production)
- **AI** — Gemini (primary) or Claude. No key? A mock generator runs automatically so you can still test everything
- **Real-time** — WebSocket + Redis pub/sub bridge between the worker and the WS server
- **PDF** — Browser `window.print()` with custom print CSS

---

## Frontend ↔ Backend integration

The frontend talks to the backend over two channels:

**REST API** — used for creating assignments, fetching papers, and triggering PDF downloads. The base URL is set via `NEXT_PUBLIC_API_URL`.

**WebSocket** — used for real-time job progress. When an assignment is submitted, the frontend opens a WS connection to the backend (`NEXT_PUBLIC_WS_URL`) and subscribes to a room keyed by `assignmentId`. The backend worker publishes progress events to Redis pub/sub, which the WS server picks up and broadcasts to the right room.

The frontend Zustand stores (`assignmentStore`, `paperStore`, `socketStore`) manage state across the app. The `useWebSocket` hook handles the WS lifecycle using refs to avoid stale closure issues.

---

## MongoDB Atlas integration

The backend connects to MongoDB Atlas using Mongoose. The connection string is passed via `MONGODB_URI`.

In production, the Atlas cluster is on AWS Mumbai (`ap-south-1`). Network access is set to `0.0.0.0/0` to allow connections from Render's dynamic IPs.

Collections:
- `assignments` — stores the form input (subject, due date, question types, status)
- `generatedpapers` — stores the AI-generated paper sections and questions, linked to an assignment by `assignmentId`

---

## Running locally

You need MongoDB and Redis running locally. Quickest way:

```bash
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

**Backend:**

```bash
cd backend
cp .env.example .env   # fill in your API keys
npm install
npm run dev
```

In a second terminal, start the worker:

```bash
cd backend
npm run worker:dev
```

**Frontend:**

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

**backend/.env**

```
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379

# Set one of these. If both are left as placeholders, mock mode kicks in.
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here

PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## Deployment

The app is split across three services:

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Root directory: `frontend`. Set the two `NEXT_PUBLIC_*` env vars pointing at your backend. |
| Backend + Worker | Render | Root directory: `backend`. Build: `npm install --include=dev && npm run build`. Start: `node dist/server.js`. The BullMQ worker runs in-process with the server. |
| Redis | Upstash | Free serverless Redis. Use the `rediss://` URL — TLS is handled automatically. |
| MongoDB | Atlas | Free M0 cluster. Allow `0.0.0.0/0` in Network Access so Render can connect. |

**Render env vars:**
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/vedaai?...
REDIS_URL=rediss://default:<password>@<host>.upstash.io:6379
GEMINI_API_KEY=your_key_here
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Vercel env vars:**
```
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://your-render-backend.onrender.com
```

> Note: On Render's free tier the backend sleeps after 15 minutes of inactivity. The first request after a sleep takes ~60 seconds to wake up.

---

## Project layout

```
vedaai/
├── backend/
│   └── src/
│       ├── controllers/     ← REST route handlers
│       ├── models/          ← Mongoose schemas (Assignment, GeneratedPaper)
│       ├── services/        ← AI generation (Claude / Gemini / Mock)
│       ├── workers/         ← BullMQ job processor
│       ├── config/          ← DB and Redis connections
│       └── routes/
└── frontend/
    └── src/
        ├── app/             ← Next.js pages
        ├── components/
        ├── store/           ← Zustand stores
        ├── hooks/           ← useWebSocket
        └── lib/             ← API client, utils
```
