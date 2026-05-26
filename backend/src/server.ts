import 'dotenv/config';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import app from './app';
import { connectDatabase } from './config/database';
import { connectRedis, redisSubscriber, PAPER_EVENTS_CHANNEL } from './config/redis';
import type { PaperEvent } from './config/redis';
import type { WSOutboundMessage } from './types/index';

const PORT = parseInt(process.env.PORT || '4000', 10);

// assignmentId → connected WS clients for that job
const rooms = new Map<string, Set<WebSocket>>();

function addToRoom(assignmentId: string, ws: WebSocket): void {
  if (!rooms.has(assignmentId)) {
    rooms.set(assignmentId, new Set());
  }
  rooms.get(assignmentId)!.add(ws);
}

function removeFromRoom(assignmentId: string, ws: WebSocket): void {
  const room = rooms.get(assignmentId);
  if (room) {
    room.delete(ws);
    if (room.size === 0) rooms.delete(assignmentId);
  }
}

function broadcastToRoom(assignmentId: string, message: WSOutboundMessage): void {
  const room = rooms.get(assignmentId);
  if (!room) return;

  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function start(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  // pub/sub clients need their own connection — can't share with BullMQ
  if (redisSubscriber.status === 'wait' || redisSubscriber.status === 'close') {
    await redisSubscriber.connect();
  }
  await redisSubscriber.subscribe(PAPER_EVENTS_CHANNEL);
  redisSubscriber.on('message', (_channel: string, message: string) => {
    try {
      const event: PaperEvent = JSON.parse(message);
      handleWorkerEvent(event);
    } catch (err) {
      console.error('[WS] Failed to parse redis event:', err);
    }
  });

  console.log(`✅ Subscribed to Redis channel: ${PAPER_EVENTS_CHANNEL}`);

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress || 'unknown';
    console.log(`[WS] Client connected from ${ip}`);

    let subscribedRoom: string | null = null;

    ws.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.type === 'subscribe' && typeof msg.assignmentId === 'string') {
          if (subscribedRoom) removeFromRoom(subscribedRoom, ws);
          subscribedRoom = msg.assignmentId as string;
          addToRoom(subscribedRoom as string, ws);
          console.log(`[WS] Client subscribed to room: ${subscribedRoom}`);
          ws.send(JSON.stringify({ type: 'subscribed', assignmentId: subscribedRoom }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      if (subscribedRoom) {
        removeFromRoom(subscribedRoom, ws);
      }
      console.log(`[WS] Client disconnected`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Socket error:', err.message);
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket available at ws://localhost:${PORT}/ws`);
  });
}

function handleWorkerEvent(event: PaperEvent): void {
  const { assignmentId } = event;

  if (event.type === 'progress') {
    broadcastToRoom(assignmentId, {
      type: 'job:progress',
      assignmentId,
      progress: event.progress ?? 0,
      message: event.message ?? 'Processing...',
    });
  } else if (event.type === 'complete') {
    broadcastToRoom(assignmentId, {
      type: 'job:complete',
      assignmentId,
      paperId: event.paperId ?? '',
    });
    // Clean up room after a delay
    setTimeout(() => rooms.delete(assignmentId), 30000);
  } else if (event.type === 'failed') {
    broadcastToRoom(assignmentId, {
      type: 'job:failed',
      assignmentId,
      error: event.error ?? 'Unknown error',
    });
    setTimeout(() => rooms.delete(assignmentId), 30000);
  }
}

process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down gracefully');
  process.exit(0);
});

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
