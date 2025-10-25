import { Request } from 'express';
import { Role } from '../../common';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  email: string;
  sessionId: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
  requestId?: string;
}
