import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import type { PaperGenerationJobData } from '../types/index';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const tlsOptions = REDIS_URL.startsWith('rediss://')
  ? { tls: { rejectUnauthorized: false } }
  : {};

export const redisConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
  ...tlsOptions,
});

// pub/sub needs dedicated connections — a BullMQ connection can't be reused for subscribe
export const redisPublisher = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  ...tlsOptions,
});

export const redisSubscriber = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  ...tlsOptions,
});

export const paperQueue = new Queue<PaperGenerationJobData>('paper-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const PAPER_EVENTS_CHANNEL = 'paper-events';

export interface PaperEvent {
  type: 'progress' | 'complete' | 'failed';
  assignmentId: string;
  progress?: number;
  message?: string;
  paperId?: string;
  error?: string;
}

export async function publishPaperEvent(event: PaperEvent): Promise<void> {
  await redisPublisher.publish(PAPER_EVENTS_CHANNEL, JSON.stringify(event));
}

async function safeConnect(client: IORedis): Promise<void> {
  // ioredis throws if you call .connect() when the client is already connecting/connected
  const status = client.status;
  if (status === 'wait' || status === 'close' || status === 'end') {
    await client.connect();
  }
}

export async function connectRedis(): Promise<void> {
  await Promise.all([
    safeConnect(redisConnection),
    safeConnect(redisPublisher),
  ]);
  console.log('✅ Redis connected');
}
