export interface Configuration {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTokenTTL: string;
    refreshTokenTTL: string;
    passwordResetTokenTTL: string;
    emailVerificationTokenTTL: string;
  };
  mail: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
  };
  clientApp: {
    url?: string;
  };
  cors: {
    origins: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  logging: {
    level: string;
  };
  features: {
    emailVerificationEnabled: boolean;
  };
  observability: {
    promEnabled: boolean;
  };
}

export default (): Configuration => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessTokenTTL: process.env.ACCESS_TOKEN_TTL || '3d',
    refreshTokenTTL: process.env.REFRESH_TOKEN_TTL || '14d',
    passwordResetTokenTTL: process.env.PASSWORD_RESET_TOKEN_TTL || '1h',
    emailVerificationTokenTTL:
      process.env.EMAIL_VERIFICATION_TOKEN_TTL || '24h',
  },
  mail: {
    host: process.env.MAIL_HOST || 'localhost',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'noreply@weightlossclinic.com',
  },
  clientApp: {
    url: process.env.CLIENT_APP_URL || undefined,
  },
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : ['http://localhost:3000'],
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  features: {
    emailVerificationEnabled:
      process.env.EMAIL_VERIFICATION_ENABLED === 'true' || false,
  },
  observability: {
    promEnabled: process.env.PROM_ENABLED !== 'false',
  },
});
