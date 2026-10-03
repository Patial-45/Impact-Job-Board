'use client';

import type { ReactNode } from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { Avatar } from './avatar';
import { classes } from './utils';

export interface MatchScoreProps {
  score: number; // 0 to 100
  breakdown?: {
    skills?: number;
    experience?: number;
    growth?: number;
  };
  showBreakdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MatchScore({
  score,
  breakdown,
  showBreakdown = false,
  size = 'md',
  className,
}: MatchScoreProps) {
  const getBadgeVariant = (s: number) => {
    if (s >= 85) return 'accent';
    if (s >= 70) return 'neutral';
    return 'outline';
  };

  return (
    <div className={classes('ui-match-score', `ui-match-score--${size}`, className)}>
      <div className="ui-match-score-main">
        <Badge variant={getBadgeVariant(score)} size={size === 'sm' ? 'sm' : 'md'}>
          {score}% Match
        </Badge>
      </div>
      {showBreakdown && breakdown && (
        <div className="ui-match-score-breakdown">
          {typeof breakdown.skills === 'number' && (
            <div className="ui-match-metric">
              <span className="ui-metric-label">Skills</span>
              <div className="ui-metric-bar">
                <span style={{ width: `${breakdown.skills}%` }} />
              </div>
              <span className="ui-metric-val">{breakdown.skills}%</span>
            </div>
          )}
          {typeof breakdown.experience === 'number' && (
            <div className="ui-match-metric">
              <span className="ui-metric-label">Experience</span>
              <div className="ui-metric-bar">
                <span style={{ width: `${breakdown.experience}%` }} />
              </div>
              <span className="ui-metric-val">{breakdown.experience}%</span>
            </div>
          )}
          {typeof breakdown.growth === 'number' && (
            <div className="ui-match-metric">
              <span className="ui-metric-label">Growth</span>
              <div className="ui-metric-bar">
                <span style={{ width: `${breakdown.growth}%` }} />
              </div>
              <span className="ui-metric-val">{breakdown.growth}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface CandidateCardProps {
  name: string;
  headline: string;
  location?: string;
  avatarUrl?: string;
  matchScore?: number;
  skills?: string[];
  currentRole?: string;
  yearsExperience?: number;
  actionSlot?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function CandidateCard({
  name,
  headline,
  location,
  avatarUrl,
  matchScore,
  skills = [],
  currentRole,
  yearsExperience,
  actionSlot,
  onClick,
  className,
}: CandidateCardProps) {
  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={classes('ui-candidate-card', className)}
    >
      <div className="ui-candidate-card-header">
        <div className="ui-candidate-card-profile">
          <Avatar name={name} src={avatarUrl} size="lg" />
          <div className="ui-candidate-meta">
            <h4 className="ui-candidate-name">{name}</h4>
            <p className="ui-candidate-headline">{headline}</p>
            <div className="ui-candidate-sub">
              {currentRole && <span className="ui-candidate-role">💼 {currentRole}</span>}
              {location && <span className="ui-candidate-location">📍 {location}</span>}
              {typeof yearsExperience === 'number' && (
                <span className="ui-candidate-exp">⏱ {yearsExperience}+ years exp</span>
              )}
            </div>
          </div>
        </div>
        {typeof matchScore === 'number' && <MatchScore score={matchScore} size="md" />}
      </div>

      {skills.length > 0 && (
        <div className="ui-candidate-skills">
          {skills.slice(0, 5).map((skill) => (
            <Badge key={skill} variant="neutral" size="sm">
              {skill}
            </Badge>
          ))}
          {skills.length > 5 && (
            <span className="ui-candidate-more-skills">+{skills.length - 5} more</span>
          )}
        </div>
      )}

      {actionSlot && <div className="ui-candidate-card-actions">{actionSlot}</div>}
    </Card>
  );
}

export interface JobCardProps {
  title: string;
  companyName: string;
  location: string;
  type?: 'Remote' | 'Hybrid' | 'On-site';
  salary?: string;
  postedAt?: string;
  matchScore?: number;
  skills?: string[];
  actionSlot?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function JobCard({
  title,
  companyName,
  location,
  type = 'Remote',
  salary,
  postedAt,
  matchScore,
  skills = [],
  actionSlot,
  onClick,
  className,
}: JobCardProps) {
  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={classes('ui-job-card', className)}
    >
      <div className="ui-job-card-top">
        <div>
          <span className="ui-job-company">{companyName}</span>
          <h3 className="ui-job-title">{title}</h3>
          <div className="ui-job-tags">
            <span className="ui-job-tag">📍 {location}</span>
            <span className="ui-job-tag">🏢 {type}</span>
            {salary && <span className="ui-job-tag">💰 {salary}</span>}
          </div>
        </div>
        {typeof matchScore === 'number' && <MatchScore score={matchScore} size="md" />}
      </div>

      {skills.length > 0 && (
        <div className="ui-job-skills">
          {skills.map((skill) => (
            <Badge key={skill} variant="outline" size="sm">
              {skill}
            </Badge>
          ))}
        </div>
      )}

      <div className="ui-job-card-bottom">
        {postedAt && <small className="ui-job-posted">Posted {postedAt}</small>}
        {actionSlot && <div className="ui-job-actions">{actionSlot}</div>}
      </div>
    </Card>
  );
}

export interface CompanyCardProps {
  name: string;
  description?: string;
  location?: string;
  openRolesCount?: number;
  industry?: string;
  logoUrl?: string;
  onClick?: () => void;
  className?: string;
}

export function CompanyCard({
  name,
  description,
  location,
  openRolesCount = 0,
  industry,
  logoUrl,
  onClick,
  className,
}: CompanyCardProps) {
  return (
    <Card
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={classes('ui-company-card', className)}
    >
      <div className="ui-company-top">
        <Avatar name={name} src={logoUrl} size="lg" />
        <div>
          <h3 className="ui-company-name">{name}</h3>
          {industry && <span className="ui-company-industry">{industry}</span>}
        </div>
      </div>
      {description && <p className="ui-company-desc">{description}</p>}
      <div className="ui-company-bottom">
        {location && <span className="ui-company-loc">📍 {location}</span>}
        <Badge variant="accent" size="sm">
          {openRolesCount} open {openRolesCount === 1 ? 'role' : 'roles'}
        </Badge>
      </div>
    </Card>
  );
}

export interface ProfileCompletionProps {
  percentage: number; // 0 to 100
  missingSteps?: string[];
  onActionClick?: () => void;
  className?: string;
}

export function ProfileCompletion({
  percentage,
  missingSteps = [],
  onActionClick,
  className,
}: ProfileCompletionProps) {
  return (
    <Card className={classes('ui-profile-completion', className)}>
      <div className="ui-profile-comp-top">
        <span className="ui-profile-comp-title">Profile Strength</span>
        <span className="ui-profile-comp-val">{percentage}%</span>
      </div>
      <div className="ui-profile-comp-bar" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div className="ui-profile-comp-fill" style={{ width: `${percentage}%` }} />
      </div>
      {missingSteps.length > 0 && (
        <div className="ui-profile-comp-steps">
          <small className="ui-profile-comp-next">Next: {missingSteps[0]}</small>
          {onActionClick && (
            <button type="button" className="ui-profile-comp-btn" onClick={onActionClick}>
              Complete now ↗
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
