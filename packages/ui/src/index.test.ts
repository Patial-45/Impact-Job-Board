import { describe, expect, it } from 'vitest';
import {
  classes,
  Button,
  Input,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  Badge,
  SkillBadge,
  ApplicationStatus,
  PipelineStage,
  Card,
  StatCard,
  Avatar,
  AvatarGroup,
  Dialog,
  Sheet,
  Dropdown,
  Tooltip,
  Popover,
  Tabs,
  Breadcrumb,
  Pagination,
  Skeleton,
  EmptyState,
  ErrorState,
  LoadingState,
  Toast,
  Table,
  DataTable,
  PageHeader,
  SectionHeader,
  FilterBar,
  CandidateCard,
  JobCard,
  CompanyCard,
  MatchScore,
  ProfileCompletion,
} from './index';

describe('packages/ui', () => {
  it('concatenates classes correctly via classes()', () => {
    expect(classes('btn', false, undefined, 'btn-primary', null)).toBe('btn btn-primary');
  });

  it('exports all core interactive primitives', () => {
    expect(Button).toBeDefined();
    expect(Input).toBeDefined();
    expect(Select).toBeDefined();
    expect(Checkbox).toBeDefined();
    expect(RadioGroup).toBeDefined();
    expect(Switch).toBeDefined();
    expect(Badge).toBeDefined();
    expect(SkillBadge).toBeDefined();
    expect(ApplicationStatus).toBeDefined();
    expect(PipelineStage).toBeDefined();
    expect(Card).toBeDefined();
    expect(StatCard).toBeDefined();
    expect(Avatar).toBeDefined();
    expect(AvatarGroup).toBeDefined();
    expect(Dialog).toBeDefined();
    expect(Sheet).toBeDefined();
    expect(Dropdown).toBeDefined();
    expect(Tooltip).toBeDefined();
    expect(Popover).toBeDefined();
    expect(Tabs).toBeDefined();
    expect(Breadcrumb).toBeDefined();
    expect(Pagination).toBeDefined();
    expect(Skeleton).toBeDefined();
    expect(EmptyState).toBeDefined();
    expect(ErrorState).toBeDefined();
    expect(LoadingState).toBeDefined();
    expect(Toast).toBeDefined();
    expect(Table).toBeDefined();
    expect(DataTable).toBeDefined();
    expect(PageHeader).toBeDefined();
    expect(SectionHeader).toBeDefined();
    expect(FilterBar).toBeDefined();
  });

  it('exports recruitment specific primitives', () => {
    expect(CandidateCard).toBeDefined();
    expect(JobCard).toBeDefined();
    expect(CompanyCard).toBeDefined();
    expect(MatchScore).toBeDefined();
    expect(ProfileCompletion).toBeDefined();
  });
});
