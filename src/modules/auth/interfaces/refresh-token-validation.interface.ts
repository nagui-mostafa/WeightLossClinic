export interface RefreshTokenValidationResult {
  userId: string;
  sessionId: string;
  jti: string;
  refreshToken: string;
}
