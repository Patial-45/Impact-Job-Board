'use client';

import type { ChangeEvent, SelectHTMLAttributes } from 'react';
import { classes } from './utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  children,
  id,
  className,
  disabled,
  ...props
}: SelectProps) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const errorId = error && selectId ? `${selectId}-error` : undefined;
  const helperId = helperText && selectId ? `${selectId}-helper` : undefined;

  return (
    <div className={classes('ui-field', disabled && 'ui-field--disabled')}>
      {label && (
        <label htmlFor={selectId} className="ui-label">
          {label}
        </label>
      )}
      <div className={classes('ui-select-wrap', error && 'ui-input-wrap--error')}>
        <select
          id={selectId}
          className={classes('ui-input', 'ui-select', className)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={classes(errorId, helperId) || undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <span className="ui-select-chevron" aria-hidden="true">
          ▾
        </span>
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

export interface MultiSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  error,
  helperText,
  options,
  value,
  onChange,
  placeholder = 'Select options…',
  disabled = false,
  className,
}: MultiSelectProps) {
  const availableOptions = options.filter((opt) => !value.includes(opt.value));

  const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val && !value.includes(val)) {
      onChange([...value, val]);
    }
    e.target.value = '';
  };

  const handleRemove = (valToRemove: string) => {
    onChange(value.filter((val) => val !== valToRemove));
  };

  return (
    <div className={classes('ui-field', disabled && 'ui-field--disabled', className)}>
      {label && <span className="ui-label">{label}</span>}
      <div className={classes('ui-multiselect-box', error && 'ui-input-wrap--error')}>
        <div className="ui-multiselect-tags">
          {value.map((val) => {
            const match = options.find((o) => o.value === val);
            return (
              <span key={val} className="ui-multiselect-pill">
                <span>{match ? match.label : val}</span>
                {!disabled && (
                  <button
                    type="button"
                    className="ui-multiselect-remove"
                    onClick={() => handleRemove(val)}
                    aria-label={`Remove ${match ? match.label : val}`}
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
        </div>
        <select
          className="ui-multiselect-select"
          onChange={handleSelect}
          disabled={disabled || availableOptions.length === 0}
          defaultValue=""
          aria-label={label || 'Select multiple options'}
        >
          <option value="" disabled>
            {value.length > 0 ? '+ Add more…' : placeholder}
          </option>
          {availableOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
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
