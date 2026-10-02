export type GlobalRole = 'USER' | 'PLATFORM_ADMIN' | 'SUPER_ADMIN';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'RECRUITER' | 'VIEWER';
export type WorkspaceAction =
  | 'workspace.read'
  | 'workspace.manage'
  | 'jobs.write'
  | 'candidates.read'
  | 'applications.write';
const grants: Record<WorkspaceRole, ReadonlySet<WorkspaceAction>> = {
  OWNER: new Set([
    'workspace.read',
    'workspace.manage',
    'jobs.write',
    'candidates.read',
    'applications.write',
  ]),
  ADMIN: new Set([
    'workspace.read',
    'workspace.manage',
    'jobs.write',
    'candidates.read',
    'applications.write',
  ]),
  RECRUITER: new Set(['workspace.read', 'jobs.write', 'candidates.read', 'applications.write']),
  VIEWER: new Set(['workspace.read']),
};
export const canWorkspace = (role: WorkspaceRole, action: WorkspaceAction) =>
  grants[role].has(action);
export const canPlatform = (role: GlobalRole, action: 'admin.read' | 'admin.manage') =>
  role === 'SUPER_ADMIN' || (role === 'PLATFORM_ADMIN' && action === 'admin.read');
