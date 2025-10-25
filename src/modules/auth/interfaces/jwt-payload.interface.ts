import { Role } from '../../common';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
  jti: string;
  sid: string;
}
