export interface RefreshJwtPayload {
  sub: string;
  sid: string;
  iat: number;
  exp: number;
  jti: string;
}
