export type GlobalRole = 'USER' | 'PLATFORM_ADMIN' | 'SUPER_ADMIN';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'RECRUITER' | 'VIEWER';
export type WorkspaceAction =
  | 'workspace.read'
  | 'workspace.manage'
  | 'workspace.members.read'
  | 'workspace.members.invite'
  | 'workspace.members.manage'
  | 'jobs.read'
  | 'jobs.write'
  | 'candidates.read'
  | 'applications.read'
  | 'applications.write'
  | 'interviews.read'
  | 'interviews.write'
  | 'assessments.read'
  | 'assessments.write'
  | 'offers.read'
  | 'offers.write'
  | 'onboarding.read'
  | 'onboarding.write'
  | 'analytics.read'
  | 'billing.read'
  | 'billing.manage';

const grants: Record<WorkspaceRole, ReadonlySet<WorkspaceAction>> = {
  OWNER: new Set([
    'workspace.read',
    'workspace.manage',
    'workspace.members.read',
    'workspace.members.invite',
    'workspace.members.manage',
    'jobs.read',
    'jobs.write',
    'candidates.read',
    'applications.read',
    'applications.write',
    'interviews.read',
    'interviews.write',
    'assessments.read',
    'assessments.write',
    'offers.read',
    'offers.write',
    'onboarding.read',
    'onboarding.write',
    'analytics.read',
    'billing.read',
    'billing.manage',
  ]),
  ADMIN: new Set([
    'workspace.read',
    'workspace.manage',
    'workspace.members.read',
    'workspace.members.invite',
    'workspace.members.manage',
    'jobs.read',
    'jobs.write',
    'candidates.read',
    'applications.read',
    'applications.write',
    'interviews.read',
    'interviews.write',
    'assessments.read',
    'assessments.write',
    'offers.read',
    'offers.write',
    'onboarding.read',
    'onboarding.write',
    'analytics.read',
    'billing.read',
  ]),
  RECRUITER: new Set([
    'workspace.read',
    'workspace.members.read',
    'jobs.read',
    'jobs.write',
    'candidates.read',
    'applications.read',
    'applications.write',
    'interviews.read',
    'interviews.write',
    'assessments.read',
    'assessments.write',
    'offers.read',
    'offers.write',
    'onboarding.read',
    'onboarding.write',
    'analytics.read',
  ]),
  VIEWER: new Set([
    'workspace.read',
    'workspace.members.read',
    'jobs.read',
    'candidates.read',
    'applications.read',
    'interviews.read',
    'assessments.read',
    'offers.read',
    'onboarding.read',
    'analytics.read',
  ]),
};

export const canWorkspace = (role: WorkspaceRole, action: WorkspaceAction): boolean =>
  grants[role]?.has(action) ?? false;

export const canPlatform = (role: GlobalRole, action: 'admin.read' | 'admin.manage'): boolean =>
  role === 'SUPER_ADMIN' || (role === 'PLATFORM_ADMIN' && action === 'admin.read');

