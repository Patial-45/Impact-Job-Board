export const QUEUES = {
  resume: 'resume',
  candidate: 'candidate',
  job: 'job',
  match: 'match',
  notification: 'notification',
  assessment: 'assessment',
  analytics: 'analytics',
} as const;
export const JOB_NAMES = [
  'resume.parse',
  'resume.embed',
  'candidate.index',
  'job.parse',
  'job.embed',
  'match.calculate',
  'notification.email',
  'assessment.generate',
  'analytics.aggregate',
] as const;
export type JobName = (typeof JOB_NAMES)[number];
export type JobEnvelope<T> = {
  version: 1;
  requestId: string;
  workspaceId?: string;
  actorUserId?: string;
  payload: T;
};
