import type { HTMLAttributes, ReactNode } from 'react';
import { classes } from './utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'outline';
  interactive?: boolean;
}

export function Card({ variant = 'default', interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={classes(
        'ui-card',
        `ui-card--${variant}`,
        interactive && 'ui-card--interactive',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes('ui-card-header', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={classes('ui-card-title', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classes('ui-card-desc', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes('ui-card-content', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes('ui-card-footer', className)} {...props} />;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  description?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  description,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={classes('ui-stat-card', className)}>
      <div className="ui-stat-card-top">
        <span className="ui-stat-title">{title}</span>
        {icon && <span className="ui-stat-icon">{icon}</span>}
      </div>
      <div className="ui-stat-val">{value}</div>
      {(change || description) && (
        <div className="ui-stat-card-bottom">
          {change && (
            <span
              className={classes(
                'ui-stat-change',
                `ui-stat-change--${change.trend}`,
              )}
            >
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '·'}{' '}
              {change.value}
            </span>
          )}
          {description && <span className="ui-stat-desc">{description}</span>}
        </div>
      )}
    </Card>
  );
}
