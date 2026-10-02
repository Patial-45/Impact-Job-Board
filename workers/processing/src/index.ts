import { Queue } from 'bullmq';
import { QUEUES, type JobEnvelope, type JobName } from '@executive-match/shared';
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export function createQueue(name: QueueName, redisUrl: string) {
  const url = new URL(redisUrl);
  return new Queue<JobEnvelope<unknown>, unknown, JobName>(name, {
    connection: {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      tls: url.protocol === 'rediss:' ? {} : undefined,
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
}
