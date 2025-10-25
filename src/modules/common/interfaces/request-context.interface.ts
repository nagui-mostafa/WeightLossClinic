export interface RequestContext {
  requestId?: string;
  userId?: string;
  ip?: string | null;
  userAgent?: string | null;
}
