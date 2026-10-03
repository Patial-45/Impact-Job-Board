'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { classes } from './utils';

export interface DropdownItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: (DropdownItem | { divider: true })[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  align = 'left',
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={classes('ui-dropdown-container', className)} ref={containerRef}>
      <div
        className="ui-dropdown-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className={classes('ui-dropdown-menu', `ui-dropdown-menu--${align}`)}
        >
          {items.map((item, idx) => {
            if ('divider' in item) {
              return <div key={`div-${idx}`} className="ui-dropdown-divider" role="separator" />;
            }
            return (
              <button
                key={item.id}
                role="menuitem"
                disabled={item.disabled}
                className={classes(
                  'ui-dropdown-item',
                  item.danger && 'ui-dropdown-item--danger',
                )}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon && <span className="ui-dropdown-icon">{item.icon}</span>}
                <span className="ui-dropdown-label">{item.label}</span>
                {item.shortcut && <span className="ui-dropdown-shortcut">{item.shortcut}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={classes('ui-tooltip-wrap', className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={classes('ui-tooltip', `ui-tooltip--${position}`)}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Popover({
  trigger,
  children,
  align = 'left',
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={classes('ui-popover-container', className)} ref={containerRef}>
      <div
        className="ui-popover-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {trigger}
      </div>
      {open && (
        <div className={classes('ui-popover-panel', `ui-popover-panel--${align}`)}>
          {children}
        </div>
      )}
    </div>
  );
}
