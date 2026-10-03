'use client';

import type { ReactNode } from 'react';
import { classes } from './utils';

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  return (
    <div className={classes('ui-tabs-nav', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            className={classes('ui-tab-btn', isActive && 'ui-tab-btn--active')}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="ui-tab-count">{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={classes('ui-breadcrumb', className)}>
      <ol className="ui-breadcrumb-list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="ui-breadcrumb-item">
              {item.href && !isLast ? (
                <a href={item.href} className="ui-breadcrumb-link">
                  {item.label}
                </a>
              ) : (
                <span
                  className="ui-breadcrumb-current"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="ui-breadcrumb-sep" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={classes('ui-pagination', className)}
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="ui-pagination-btn ui-pagination-prev"
        aria-label="Previous page"
      >
        ← Prev
      </button>

      <span className="ui-pagination-status">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="ui-pagination-btn ui-pagination-next"
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}
