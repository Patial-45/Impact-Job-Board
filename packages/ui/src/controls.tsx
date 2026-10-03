'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';
import { classes } from './utils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  helperText?: string;
  error?: string;
}

export function Checkbox({
  label,
  helperText,
  error,
  id,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  const checkboxId = id || `cb-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={classes('ui-control-group', disabled && 'ui-control-group--disabled', className)}>
      <label htmlFor={checkboxId} className="ui-checkbox-label">
        <input
          id={checkboxId}
          type="checkbox"
          className="ui-checkbox-input"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span className="ui-checkbox-box" aria-hidden="true">
          <svg viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1.5 5 4.5 8 10.5 1.5" />
          </svg>
        </span>
        <span className="ui-control-text">{label}</span>
      </label>
      {error ? (
        <p role="alert" className="ui-field-error">
          {error}
        </p>
      ) : helperText ? (
        <p className="ui-field-helper">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  error,
  disabled = false,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={classes('ui-fieldset', disabled && 'ui-fieldset--disabled', className)}>
      {label && <legend className="ui-label">{label}</legend>}
      <div className="ui-radio-group">
        {options.map((opt) => {
          const radioId = `${name}-${opt.value}`;
          const isChecked = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={radioId}
              className={classes(
                'ui-radio-label',
                (disabled || opt.disabled) && 'ui-radio-label--disabled',
              )}
            >
              <input
                id={radioId}
                type="radio"
                name={name}
                value={opt.value}
                checked={isChecked}
                onChange={() => onChange?.(opt.value)}
                disabled={disabled || opt.disabled}
                className="ui-radio-input"
              />
              <span className="ui-radio-circle" aria-hidden="true">
                <span className="ui-radio-inner" />
              </span>
              <div className="ui-control-text">
                <span>{opt.label}</span>
                {opt.description && <small className="ui-control-desc">{opt.description}</small>}
              </div>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="ui-field-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 9)}`;

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === ' ' || e.key === 'Enter') && !disabled) {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      className={classes('ui-switch-row', disabled && 'ui-switch-row--disabled', className)}
      onClick={handleClick}
    >
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={classes('ui-switch', checked && 'ui-switch--checked')}
        onKeyDown={handleKeyDown}
      >
        <span className="ui-switch-thumb" />
      </button>
      {label && (
        <label htmlFor={switchId} className="ui-switch-label" onClick={(e) => e.stopPropagation()}>
          <span className="ui-switch-title">{label}</span>
          {description && <span className="ui-switch-desc">{description}</span>}
        </label>
      )}
    </div>
  );
}
