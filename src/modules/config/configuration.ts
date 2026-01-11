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
  objectStorage: {
    driver: 'minio' | 's3';
    endpoint?: string;
    region?: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
    useSSL: boolean;
    publicBaseUrl?: string;
  };
  shipping: {
    fedex: {
      baseUrl: string;
      apiKey: string;
      apiSecret: string;
      useMock: boolean;
    };
  };
  groupon: {
    baseUrl: string;
    configName: string;
    clientId: string;
    apiKey: string;
    nonce: string;
    reservationTtlMs: number;
    retryMax: number;
    retryBackoffMs: number;
    reconciliationEnabled: boolean;
    useMock: boolean;
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
  objectStorage: {
    driver: (process.env.OBJECT_STORAGE_DRIVER as 'minio' | 's3') || 'minio',
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || 'http://localhost:9000',
    region: process.env.OBJECT_STORAGE_REGION || 'us-east-1',
    bucket: process.env.OBJECT_STORAGE_BUCKET || 'weight-loss-media',
    accessKey: process.env.OBJECT_STORAGE_ACCESS_KEY || '',
    secretKey: process.env.OBJECT_STORAGE_SECRET_KEY || '',
    forcePathStyle: process.env.OBJECT_STORAGE_FORCE_PATH_STYLE !== 'false',
    useSSL: process.env.OBJECT_STORAGE_USE_SSL === 'true',
    publicBaseUrl:
      process.env.OBJECT_STORAGE_PUBLIC_BASE_URL?.trim() || undefined,
  },
  shipping: {
    fedex: {
      baseUrl:
        process.env.FEDEX_API_BASE_URL ||
        'https://api.fedex.com/track/v1/shipments',
      apiKey: process.env.FEDEX_API_KEY || 'replace-with-fedex-api-key',
      apiSecret: process.env.FEDEX_API_SECRET || 'replace-with-fedex-secret',
      useMock: process.env.FEDEX_USE_MOCK !== 'false',
    },
  },
  groupon: {
    baseUrl:
      process.env.GROUPON_BASE_URL || 'https://offer-api.groupon.com/partners',
    configName: process.env.GROUPON_CONFIG_NAME || 'joey-med-preprod',
    clientId: process.env.GROUPON_CLIENT_ID || '',
    apiKey: process.env.GROUPON_API_KEY || '',
    nonce: process.env.GROUPON_NONCE || '',
    reservationTtlMs: parseInt(
      process.env.GROUPON_RESERVATION_TTL_MS || '900000',
      10,
    ), // 15m default
    retryMax: parseInt(process.env.GROUPON_RETRY_MAX || '3', 10),
    retryBackoffMs: parseInt(process.env.GROUPON_RETRY_BACKOFF_MS || '250', 10),
    reconciliationEnabled:
      process.env.GROUPON_RECONCILIATION_ENABLED !== 'false',
    useMock: process.env.GROUPON_USE_MOCK === 'true',
  },
});
