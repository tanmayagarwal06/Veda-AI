# VedaAI — AI Assessment Creator

An AI-powered exam paper generation platform for teachers. Create structured, multi-section question papers with a single form submission — powered by Claude AI, delivered in real-time via WebSockets.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│                                                                  │
│  Next.js 14 App Router + Zustand + Tailwind CSS                  │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────────┐   │
│  │ /assignments│   │   /create   │   │    /paper/[id]       │   │
│  │  Dashboard  │   │  Form UI    │   │  Generated Output    │   │
│  └─────────────┘   └─────────────┘   └──────────────────────┘   │
│          │               │HTTP POST          │ WebSocket          │
└──────────┼───────────────┼──────────────────┼────────────────────┘
           │               │                  │
           ▼               ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js / Express)                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  Express HTTP Server                      │    │
│  │  POST /api/assignments  →  Save to MongoDB + Enqueue     │    │
│  │  GET  /api/assignments  →  List all assignments           │    │
│  │  GET  /api/assignments/:id  →  Assignment + Paper status  │    │
│  │  GET  /api/paper/by-assignment/:id  →  Generated paper   │    │
│  │  GET  /api/paper/:id/pdf  →  Puppeteer PDF export        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                          │                                       │
│  ┌──────────────┐   ┌────┴──────────┐   ┌───────────────────┐   │
│  │  WebSocket   │   │   BullMQ      │   │   Redis Pub/Sub   │   │
│  │  Server (ws) │◄──│   Queue       │   │   (events bridge) │   │
│  │  /ws endpoint│   │ paper-generat.│   │                   │   │
│  └──────────────┘   └──────┬────────┘   └─────────┬─────────┘   │
│                            │                       ▲             │
└────────────────────────────┼───────────────────────┼─────────────┘
                             │                       │
                             ▼                       │
┌──────────────────────────────────────────────────────────────────┐
│                    WORKER PROCESS (paperWorker.ts)               │
│                                                                  │
│  1. Pick job from BullMQ queue                                   │
│  2. Fetch Assignment from MongoDB                                │
│  3. Build structured prompt from assignment fields               │
│  4. Call Claude API (claude-sonnet-4-20250514)                  │
│  5. Parse + validate JSON response (Zod schema)                  │
│  6. Retry once if validation fails                               │
│  7. Save GeneratedPaper to MongoDB                               │
│  8. Publish completion event to Redis → WS server               │
│  9. WS server pushes job:complete to subscribed client          │
│                                                                  │
│  Claude System Prompt:                                           │
│  "Return ONLY valid JSON — no markdown, no explanation"          │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User fills form → POST /api/assignments
     ↓
MongoDB: Assignment{status: pending} + BullMQ: job added
     ↓
Client connects WebSocket, subscribes to assignmentId room
     ↓
Worker picks up job → calls Claude API
     ↓
Worker publishes Redis event → Server forwards to WS client
     ↓
Client receives job:complete → redirects to /paper/:id
     ↓
Frontend fetches GeneratedPaper → renders exam paper
```

---

## Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| AI Model | `claude-sonnet-4-20250514` | Best reasoning-to-cost ratio for structured JSON generation |
| Prompt Strategy | System prompt enforces strict JSON schema; retries once on parse failure | Prevents hallucinated markdown from breaking the parser |
| Job Queue | BullMQ + Redis | Persistent, retryable jobs; worker isolation prevents API timeouts from blocking the HTTP server |
| WebSocket | Native `ws` library | Lightweight, no socket.io overhead; room concept via Map |
| WS-to-Worker Bridge | Redis pub/sub | Worker is a separate process; Redis is already available |
| State Management | Zustand | Minimal boilerplate, great DX for form + async state |
| Form Validation | Zod | Schema-first validation shared between frontend and backend concepts |
| PDF Generation | Puppeteer | Full HTML rendering → pixel-perfect PDF matching the on-screen layout |
| Styling | Tailwind CSS | Utility-first, easy to match Figma spacing values exactly |

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas URI)
- Redis (local or Redis Cloud)
- Anthropic API key

### 1. Clone / Navigate

```bash
cd vedaai
```

### 2. Backend Setup

```bash
cd backend
npm install

# Copy env and fill in values
cp .env.example .env
```

Edit `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy env
cp .env.local.example .env.local
```

`frontend/.env.local` (defaults work for local dev):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### 4. Run Everything

You need **three terminal windows**:

**Terminal 1 — Backend API + WebSocket server:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Paper generation worker:**
```bash
cd backend
npm run worker:dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

### 5. Production Build

```bash
# Backend
cd backend && npm run build && npm start

# Worker
cd backend && node dist/workers/paperWorker.js

# Frontend
cd frontend && npm run build && npm start
```

---

## Job Queue Flow

```
1. POST /api/assignments
   ├── Validates input (Zod)
   ├── Creates Assignment in MongoDB (status: "pending")
   ├── Adds job to BullMQ queue "paper-generation"
   └── Returns { assignmentId }

2. Client
   ├── Stores assignmentId
   ├── Connects WebSocket (ws://localhost:4000/ws)
   └── Sends { type: "subscribe", assignmentId }

3. BullMQ Worker (separate process)
   ├── Receives job
   ├── Updates Assignment status → "processing"
   ├── Publishes progress events to Redis
   ├── Calls Claude API with structured prompt
   ├── Parses + validates JSON response
   │   └── Retries once if invalid
   ├── Saves GeneratedPaper to MongoDB
   ├── Updates Assignment status → "done"
   └── Publishes "complete" event to Redis

4. WebSocket Server (subscribes to Redis)
   ├── Receives Redis events
   └── Forwards to all WS clients subscribed to that assignmentId

5. Client receives job:complete
   └── Redirects to /paper/:assignmentId
       └── Fetches GeneratedPaper from API and renders
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/assignments` | List all assignments |
| `POST` | `/api/assignments` | Create assignment + queue job |
| `GET` | `/api/assignments/:id` | Get assignment + paper status |
| `DELETE` | `/api/assignments/:id` | Delete assignment + paper |
| `POST` | `/api/assignments/:id/regenerate` | Re-queue generation |
| `GET` | `/api/paper/:id` | Get generated paper by paper ID |
| `GET` | `/api/paper/by-assignment/:id` | Get paper by assignment ID |
| `GET` | `/api/paper/:id/pdf` | Download paper as PDF |
| `WS` | `/ws` | WebSocket endpoint |

---

## Environment Variables

### Backend
| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/vedaai` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `PORT` | HTTP server port | `4000` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |

### Frontend
| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `ws://localhost:4000` |
