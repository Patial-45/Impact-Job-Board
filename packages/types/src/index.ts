export type ApiError = { code: string; message: string | object; requestId?: string };
export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };
export type Viewer = {
  id: string;
  email: string;
  globalRole: 'USER' | 'PLATFORM_ADMIN' | 'SUPER_ADMIN';
};
