import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { classes } from './utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  className,
  disabled,
  ...props
}: InputProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

  return (
    <div className={classes('ui-field', disabled && 'ui-field--disabled')}>
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <div className={classes('ui-input-wrap', error && 'ui-input-wrap--error')}>
        {leftIcon && <span className="ui-input-icon ui-input-icon--left">{leftIcon}</span>}
        <input
          id={inputId}
          className={classes(
            'ui-input',
            Boolean(leftIcon) && 'ui-input--has-left-icon',
            Boolean(rightIcon) && 'ui-input--has-right-icon',
            className,
          )}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={classes(errorId, helperId) || undefined}
          {...props}
        />
        {rightIcon && <span className="ui-input-icon ui-input-icon--right">{rightIcon}</span>}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="ui-field-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="ui-field-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export interface SearchInputProps extends Omit<InputProps, 'type' | 'leftIcon'> {
  onClear?: () => void;
}

export function SearchInput({ onClear, value, rightIcon, ...props }: SearchInputProps) {
  const showClear = Boolean(value && onClear);

  return (
    <Input
      type="search"
      leftIcon={
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      }
      rightIcon={
        showClear ? (
          <button
            type="button"
            className="ui-input-clear-btn"
            onClick={onClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : (
          rightIcon
        )
      }
      value={value}
      {...props}
    />
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  className,
  disabled,
  ...props
}: TextareaProps) {
  const textareaId =
    id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = error && textareaId ? `${textareaId}-error` : undefined;
  const helperId = helperText && textareaId ? `${textareaId}-helper` : undefined;

  return (
    <div className={classes('ui-field', disabled && 'ui-field--disabled')}>
      {label && (
        <label htmlFor={textareaId} className="ui-label">
          {label}
        </label>
      )}
      <div className={classes('ui-input-wrap', error && 'ui-input-wrap--error')}>
        <textarea
          id={textareaId}
          className={classes('ui-input', 'ui-textarea', className)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={classes(errorId, helperId) || undefined}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} role="alert" className="ui-field-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="ui-field-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
