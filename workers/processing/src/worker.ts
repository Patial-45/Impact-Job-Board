import { PrismaClient } from '@executive-match/database';
import { DeterministicEmbeddingProvider } from '@executive-match/ai';
import { ConsoleEmailSender } from '@executive-match/email';
import { QUEUES, type JobEnvelope } from '@executive-match/shared';
import {
  createWorker,
  type CandidateEmbedPayload,
  type JobEmbedPayload,
  type MatchCalculatePayload,
} from './index';
import { createCandidateEmbedProcessor } from './processors/candidate-embed.processor';
import { createJobEmbedProcessor } from './processors/job-embed.processor';
import { createMatchCalculateProcessor } from './processors/match-calculate.processor';
import {
  createNotificationEmailProcessor,
  type NotificationEmailPayload,
} from './processors/notification-email.processor';

export interface WorkerServiceInstance {
  db: PrismaClient;
  workers: Array<{ name: string; close: () => Promise<void> }>;
  stop: () => Promise<void>;
}

export async function startWorkerService(redisUrl?: string): Promise<WorkerServiceInstance> {
  const url = redisUrl || process.env.REDIS_URL;
  const db = new PrismaClient();
  const embeddingProvider = new DeterministicEmbeddingProvider();
  const emailSender = new ConsoleEmailSender();

  const candidateProcessor = createCandidateEmbedProcessor(db, embeddingProvider);
  const jobProcessor = createJobEmbedProcessor(db, embeddingProvider);
  const matchProcessor = createMatchCalculateProcessor(db);
  const notificationProcessor = createNotificationEmailProcessor(emailSender);

  const workers: Array<{ name: string; close: () => Promise<void> }> = [];

  if (url) {
    console.log(`[WorkerService] Initializing BullMQ workers connected to Redis: ${url.replace(/:[^:@]+@/, ':***@')}`);

    const candidateWorker = createWorker(
      QUEUES.candidate,
      (job) => candidateProcessor(job.data as JobEnvelope<CandidateEmbedPayload>),
      url,
      5,
    );
    candidateWorker.on('completed', (j) => console.log(`[Worker] Candidate job completed: ${j.id}`));
    candidateWorker.on('failed', (j, err) => console.error(`[Worker] Candidate job failed: ${j?.id}`, err));
    workers.push({ name: QUEUES.candidate, close: () => candidateWorker.close() });

    const jobWorker = createWorker(
      QUEUES.job,
      (job) => jobProcessor(job.data as JobEnvelope<JobEmbedPayload>),
      url,
      5,
    );
    jobWorker.on('completed', (j) => console.log(`[Worker] Job requisition job completed: ${j.id}`));
    jobWorker.on('failed', (j, err) => console.error(`[Worker] Job requisition job failed: ${j?.id}`, err));
    workers.push({ name: QUEUES.job, close: () => jobWorker.close() });

    const matchWorker = createWorker(
      QUEUES.match,
      (job) => matchProcessor(job.data as JobEnvelope<MatchCalculatePayload>),
      url,
      2,
    );
    matchWorker.on('completed', (j) => console.log(`[Worker] Match job completed: ${j.id}`));
    matchWorker.on('failed', (j, err) => console.error(`[Worker] Match job failed: ${j?.id}`, err));
    workers.push({ name: QUEUES.match, close: () => matchWorker.close() });

    const notificationWorker = createWorker(
      QUEUES.notification,
      (job) => notificationProcessor(job.data as JobEnvelope<NotificationEmailPayload>),
      url,
      10,
    );
    notificationWorker.on('completed', (j) => console.log(`[Worker] Notification job completed: ${j.id}`));
    notificationWorker.on('failed', (j, err) => console.error(`[Worker] Notification job failed: ${j?.id}`, err));
    workers.push({ name: QUEUES.notification, close: () => notificationWorker.close() });

    console.log(`[WorkerService] Successfully started ${workers.length} queue workers`);
  } else {
    console.log('[WorkerService] REDIS_URL not configured — queue processors registered in standby mode');
  }

  const stop = async () => {
    console.log('[WorkerService] Gracefully stopping worker service...');
    for (const w of workers) {
      try {
        await w.close();
      } catch (err) {
        console.error(`[WorkerService] Error closing worker ${w.name}:`, err);
      }
    }
    await db.$disconnect();
    console.log('[WorkerService] Worker service stopped');
  };

  return { db, workers, stop };
}

// CLI bootstrap if executed directly
if (require.main === module) {
  startWorkerService()
    .then((instance) => {
      const shutdown = async () => {
        await instance.stop();
        process.exit(0);
      };
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    })
    .catch((err) => {
      console.error('[WorkerService] Fatal error starting worker:', err);
      process.exit(1);
    });
}
