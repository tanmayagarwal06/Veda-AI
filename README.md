# VedaAI

An exam paper generator for teachers. Fill in a form — subject, question types, marks — and the AI writes the full paper. You get real-time progress while it generates, then download it as a PDF.

Built to solve a real problem: writing 40-question papers by hand every exam cycle takes forever.

---

## How it works

1. Create an assignment — pick your subject, due date, and question mix (MCQ, Short Answer, Long Answer, Numerical, etc.)
2. Submit — the backend queues a job and calls the AI (Claude or Gemini)
3. Watch it generate in real-time over WebSocket
4. Get the formatted paper — download as PDF or regenerate if you want different questions

---

## Tech

- **Frontend** — Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend** — Express, TypeScript, MongoDB, Redis, BullMQ
- **AI** — Claude (preferred) or Gemini. No key? It runs a mock generator so you can still test everything
- **PDF** — Puppeteer
- **Real-time** — WebSocket + Redis pub/sub bridge between the worker and the WS server

---

## Running locally

You need MongoDB and Redis. Quickest way:

```bash
docker run -d -p 27017:27017 mongo
docker run -d -p 6379:6379 redis
```

**Backend:**

```bash
cd backend
cp .env.example .env   # add your API key
npm install
npm run dev
```

In a second terminal, start the worker (it handles the actual AI generation):

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
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## Deployment

- **Frontend** → Vercel. Set the two `NEXT_PUBLIC_*` env vars pointing at your backend.
- **Backend** → Railway. Uses `railway.toml` (nixpacks build). Run the worker as a separate Railway service with start command `node dist/workers/paperWorker.js`.

Both services need to share the same MongoDB and Redis instance.

---

## Project layout

```
vedaai/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── models/
│       ├── services/       ← AI generation (Claude / Gemini / Mock)
│       ├── workers/        ← BullMQ job processor
│       ├── config/         ← DB and Redis
│       └── routes/
└── frontend/
    └── src/
        ├── app/            ← Next.js pages
        ├── components/
        ├── store/          ← Zustand
        ├── hooks/          ← useWebSocket
        └── lib/            ← API client, utils
```
