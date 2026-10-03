'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import { classes } from './utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={classes('ui-skeleton', `ui-skeleton--${variant}`, className)}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={classes('ui-empty', className)}>
      <div className="ui-empty-mark" aria-hidden="true">
        {icon || '↗'}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={classes('ui-error-state', className)} role="alert">
      <div className="ui-error-icon" aria-hidden="true">
        ⚠
      </div>
      <div className="ui-error-content">
        <strong className="ui-error-title">{title}</strong>
        <p className="ui-error-msg">{message}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="ui-button ui-button--secondary ui-button--sm">
          Retry
        </button>
      )}
    </div>
  );
}

export function LoadingState({
  label = 'Loading…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={classes('ui-loading-state', className)} role="status" aria-live="polite">
      <div className="ui-spinner" aria-hidden="true" />
      <span className="ui-loading-label">{label}</span>
    </div>
  );
}

export interface ToastProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  message,
  onClose,
  className,
}: ToastProps) {
  return (
    <div className={classes('ui-toast', `ui-toast--${type}`, className)} role="alert">
      <div className="ui-toast-content">
        {title && <strong className="ui-toast-title">{title}</strong>}
        <div className="ui-toast-msg">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ui-toast-close"
          aria-label="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
