import { Queue, Worker, type Processor } from 'bullmq';
import { QUEUES, type JobEnvelope, type JobName } from '@executive-match/shared';

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export type CandidateEmbedPayload = {
  candidateProfileId: string;
  force?: boolean;
};

export type JobEmbedPayload = {
  jobId: string;
  force?: boolean;
};

export type MatchCalculatePayload = {
  jobId: string;
  candidateProfileId?: string;
  force?: boolean;
};

export function parseRedisConnection(redisUrl: string) {
  const url = new URL(redisUrl);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}

export function createQueue(name: QueueName, redisUrl: string) {
  return new Queue<JobEnvelope<unknown>, unknown, JobName>(name, {
    connection: parseRedisConnection(redisUrl),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
}

export function createWorker<T>(
  name: QueueName,
  processor: Processor<JobEnvelope<T>, unknown, JobName>,
  redisUrl: string,
  concurrency = 5,
) {
  return new Worker<JobEnvelope<T>, unknown, JobName>(name, processor, {
    connection: parseRedisConnection(redisUrl),
    concurrency,
  });
}
