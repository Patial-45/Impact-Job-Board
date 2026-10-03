import type { ReactNode } from 'react';
import { classes } from './utils';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={classes('ui-page-header', className)}>
      <div className="ui-page-header-content">
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ui-page-header-actions">{actions}</div>}
    </header>
  );
}

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div className={classes('ui-section-header', className)}>
      <div>
        {eyebrow && <span className="ui-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {description && <p className="ui-section-desc">{description}</p>}
      </div>
      {children && <div className="ui-section-actions">{children}</div>}
    </div>
  );
}

export interface FilterBarProps {
  searchSlot?: ReactNode;
  filterSlots?: ReactNode;
  actionSlot?: ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  className?: string;
}

export function FilterBar({
  searchSlot,
  filterSlots,
  actionSlot,
  activeFilterCount = 0,
  onClearFilters,
  className,
}: FilterBarProps) {
  return (
    <div className={classes('ui-filter-bar', className)}>
      <div className="ui-filter-left">
        {searchSlot && <div className="ui-filter-search">{searchSlot}</div>}
        {filterSlots && <div className="ui-filter-chips">{filterSlots}</div>}
        {activeFilterCount > 0 && onClearFilters && (
          <button
            type="button"
            className="ui-filter-clear-btn"
            onClick={onClearFilters}
          >
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>
      {actionSlot && <div className="ui-filter-right">{actionSlot}</div>}
    </div>
  );
}
