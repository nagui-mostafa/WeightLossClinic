process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://placeholder:placeholder@localhost:5432/weight_loss_clinic?schema=public';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m';
process.env.REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL ?? '14d';
