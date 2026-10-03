import type { HTMLAttributes, ReactNode } from 'react';
import { classes } from './utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  icon?: ReactNode;
}

export function Badge({
  variant = 'accent',
  size = 'md',
  icon,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={classes('ui-badge', `ui-badge--${variant}`, `ui-badge--${size}`, className)}
      {...props}
    >
      {icon && <span className="ui-badge-icon">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

export interface SkillBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  skill: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verified?: boolean;
}

export function SkillBadge({ skill, level, verified, className, ...props }: SkillBadgeProps) {
  return (
    <span className={classes('ui-skill-badge', verified && 'ui-skill-badge--verified', className)} {...props}>
      <span className="ui-skill-name">{skill}</span>
      {level && <span className="ui-skill-level">· {level}</span>}
      {verified && (
        <span className="ui-skill-check" title="Verified skill" aria-label="Verified skill">
          ✓
        </span>
      )}
    </span>
  );
}

export type ApplicationStatusType =
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interviewing'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

const statusConfig: Record<
  ApplicationStatusType,
  { label: string; variant: BadgeProps['variant'] }
> = {
  submitted: { label: 'Submitted', variant: 'neutral' },
  under_review: { label: 'Under Review', variant: 'accent' },
  shortlisted: { label: 'Shortlisted', variant: 'accent' },
  interviewing: { label: 'Interviewing', variant: 'warning' },
  offered: { label: 'Offered', variant: 'success' },
  rejected: { label: 'Declined', variant: 'danger' },
  withdrawn: { label: 'Withdrawn', variant: 'outline' },
};

export function ApplicationStatus({
  status,
  className,
}: {
  status: ApplicationStatusType;
  className?: string;
}) {
  const conf = statusConfig[status] || { label: status, variant: 'neutral' };
  return (
    <Badge variant={conf.variant} size="sm" className={className}>
      {conf.label}
    </Badge>
  );
}

export function PipelineStage({
  stage,
  order,
  active,
}: {
  stage: string;
  order?: number;
  active?: boolean;
}) {
  return (
    <span className={classes('ui-pipeline-stage', active && 'ui-pipeline-stage--active')}>
      {typeof order === 'number' && <span className="ui-stage-order">{order}</span>}
      <span className="ui-stage-label">{stage}</span>
    </span>
  );
}
