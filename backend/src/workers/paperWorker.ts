import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { connectDatabase } from '../config/database';
import { redisConnection, redisPublisher, publishPaperEvent } from '../config/redis';
import { Assignment } from '../models/Assignment';
import { GeneratedPaper } from '../models/GeneratedPaper';
import { generatePaper } from '../services/claudeService';
import type { PaperGenerationJobData } from '../types/index';

async function bootstrap() {
  await connectDatabase();
  await redisPublisher.connect();
  console.log('🚀 Paper generation worker started');
}

async function processJob(job: Job<PaperGenerationJobData>): Promise<void> {
  const { assignmentId } = job.data;
  console.log(`[Worker] Processing job ${job.id} for assignment ${assignmentId}`);

  const assignment = await Assignment.findByIdAndUpdate(
    assignmentId,
    { status: 'processing' },
    { new: true }
  );

  if (!assignment) {
    throw new Error(`Assignment ${assignmentId} not found`);
  }

  await publishPaperEvent({
    type: 'progress',
    assignmentId,
    progress: 10,
    message: 'Assignment found, preparing prompt...',
  });

  await job.updateProgress(10);

  await publishPaperEvent({
    type: 'progress',
    assignmentId,
    progress: 30,
    message: 'Generating questions with AI...',
  });

  await job.updateProgress(30);

  const paperData = await generatePaper(
    assignment.subject,
    assignment.dueDate.toISOString().split('T')[0],
    assignment.questionTypes,
    assignment.additionalInstructions,
    assignment.fileContent
  );

  await publishPaperEvent({
    type: 'progress',
    assignmentId,
    progress: 80,
    message: 'Paper generated, saving to database...',
  });

  await job.updateProgress(80);

  const generatedPaper = await GeneratedPaper.create({
    assignmentId: assignment._id,
    sections: paperData.sections,
    generatedAt: new Date(),
  });

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'done' });

  await job.updateProgress(100);

  await publishPaperEvent({
    type: 'complete',
    assignmentId,
    paperId: String(generatedPaper._id),
  });

  console.log(
    `[Worker] Job ${job.id} complete — paper ${generatedPaper._id} created`
  );
}

bootstrap().then(() => {
  const worker = new Worker<PaperGenerationJobData>(
    'paper-generation',
    processJob,
    {
      connection: redisConnection,
      concurrency: 3,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] ✅ Job ${job.id} completed`);
  });

  worker.on('failed', async (job, error) => {
    console.error(`[Worker] ❌ Job ${job?.id} failed:`, error.message);

    if (job?.data.assignmentId) {
      await Assignment.findByIdAndUpdate(job.data.assignmentId, { status: 'failed' }).catch(
        console.error
      );

      await publishPaperEvent({
        type: 'failed',
        assignmentId: job.data.assignmentId,
        error: error.message,
      }).catch(console.error);
    }
  });

  worker.on('error', (error) => {
    console.error('[Worker] Worker error:', error);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[Worker] Shutting down gracefully...');
    await worker.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('[Worker] Shutting down gracefully...');
    await worker.close();
    process.exit(0);
  });
}).catch((err) => {
  console.error('[Worker] Bootstrap failed:', err);
  process.exit(1);
});
