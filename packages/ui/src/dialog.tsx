'use client';

import { useEffect, type ReactNode } from 'react';
import { classes } from './utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-dialog-backdrop" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-desc' : undefined}
        className={classes('ui-dialog', `ui-dialog--${size}`, className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-dialog-header">
          <div>
            <h2 id="dialog-title" className="ui-dialog-title">
              {title}
            </h2>
            {description && (
              <p id="dialog-desc" className="ui-dialog-desc">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="ui-dialog-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>
        <div className="ui-dialog-body">{children}</div>
        {footer && <div className="ui-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  position?: 'left' | 'right';
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  position = 'right',
  children,
  footer,
  className,
}: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
        className={classes(
          'ui-sheet',
          `ui-sheet--${position}`,
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-sheet-header">
          <div>
            {title && <h2 className="ui-sheet-title">{title}</h2>}
            {description && <p className="ui-sheet-desc">{description}</p>}
          </div>
          <button
            type="button"
            className="ui-dialog-close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>
        <div className="ui-sheet-body">{children}</div>
        {footer && <div className="ui-sheet-footer">{footer}</div>}
      </div>
    </div>
  );
}
