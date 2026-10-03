import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { classes } from './utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classes(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        loading && 'ui-button--loading',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span className="ui-button-spinner" aria-hidden="true" />
      ) : (
        iconLeft && <span className="ui-button-icon-left">{iconLeft}</span>
      )}
      <span className="ui-button-text">{children}</span>
      {!loading && iconRight && <span className="ui-button-icon-right">{iconRight}</span>}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  children,
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={classes(
        'ui-button',
        'ui-button--icon-only',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        loading && 'ui-button--loading',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <span className="ui-button-spinner" aria-hidden="true" /> : children}
    </button>
  );
}
