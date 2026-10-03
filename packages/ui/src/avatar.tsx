'use client';

import { useState, type HTMLAttributes } from 'react';
import { classes } from './utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const showImage = src && !hasError;

  return (
    <div
      className={classes('ui-avatar', `ui-avatar--${size}`, className)}
      title={name}
      aria-label={name}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="ui-avatar-img"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="ui-avatar-initials" aria-hidden="true">
          {getInitials(name)}
        </span>
      )}
      {status && (
        <span
          className={classes('ui-avatar-status', `ui-avatar-status--${status}`)}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({
  children,
  className,
  ...props
}: AvatarGroupProps) {
  return (
    <div className={classes('ui-avatar-group', className)} {...props}>
      {children}
    </div>
  );
}
