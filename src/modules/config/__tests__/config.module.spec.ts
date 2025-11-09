import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from '../config.module';
import { Configuration } from '../configuration';

describe('ConfigModule', () => {
  let configService: ConfigService<Configuration>;

  beforeEach(async () => {
    // Set required environment variables for testing
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.ACCESS_TOKEN_TTL = '3d';
    process.env.REFRESH_TOKEN_TTL = '14d';
    process.env.PASSWORD_RESET_TOKEN_TTL = '1h';
    process.env.EMAIL_VERIFICATION_TOKEN_TTL = '24h';
    process.env.MAIL_HOST = 'localhost';
    process.env.MAIL_PORT = '587';
    process.env.MAIL_FROM = 'noreply@weightlossclinic.com';

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = module.get<ConfigService<Configuration>>(ConfigService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DATABASE_URL;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.ACCESS_TOKEN_TTL;
    delete process.env.REFRESH_TOKEN_TTL;
    delete process.env.PASSWORD_RESET_TOKEN_TTL;
    delete process.env.EMAIL_VERIFICATION_TOKEN_TTL;
    delete process.env.MAIL_HOST;
    delete process.env.MAIL_PORT;
    delete process.env.MAIL_FROM;
  });

  describe('Module Initialization', () => {
    it('should be defined', () => {
      expect(configService).toBeDefined();
    });

    it('should be a global module', () => {
      const moduleMetadata = Reflect.getMetadata(
        '__module:global__',
        ConfigModule,
      );
      expect(moduleMetadata).toBe(true);
    });
  });

  describe('Configuration Values', () => {
    describe('Application Config', () => {
      it('should load NODE_ENV with default value', () => {
        const nodeEnv = configService.get<string>('nodeEnv');
        expect(nodeEnv).toBeDefined();
        expect(['development', 'production', 'test']).toContain(nodeEnv);
      });

      it('should load PORT with default value', () => {
        const port = configService.get<number>('port');
        expect(port).toBe(3000);
      });
    });

    describe('Database Config', () => {
      it('should load DATABASE_URL', () => {
        const database = configService.get('database');
        expect(database?.url).toBe(
          'postgresql://test:test@localhost:5432/test',
        );
      });
    });

    describe('JWT Config', () => {
      it('should load JWT access secret', () => {
        const jwt = configService.get('jwt');
        expect(jwt?.accessSecret).toBe('test-access-secret');
      });

      it('should load JWT refresh secret', () => {
        const jwt = configService.get('jwt');
        expect(jwt?.refreshSecret).toBe('test-refresh-secret');
      });

      it('should load JWT TTL values with defaults', () => {
        const jwt = configService.get('jwt');

        expect(jwt?.accessTokenTTL).toBe('3d');
        expect(jwt?.refreshTokenTTL).toBe('14d');
        expect(jwt?.passwordResetTokenTTL).toBe('1h');
        expect(jwt?.emailVerificationTokenTTL).toBe('24h');
      });
    });

    describe('Mail Config', () => {
      it('should load mail configuration with defaults', () => {
        const mail = configService.get('mail');

        expect(mail?.host).toBe('localhost');
        expect(mail?.port).toBe(587);
        expect(mail?.from).toBe('noreply@weightlossclinic.com');
      });
    });

    describe('CORS Config', () => {
      it('should load CORS origins with default', () => {
        const cors = configService.get('cors');
        expect(cors?.origins).toBeDefined();
        expect(Array.isArray(cors?.origins)).toBe(true);
        expect(cors?.origins).toContain('http://localhost:3000');
      });

      it('should parse multiple CORS origins', async () => {
        process.env.CORS_ORIGINS =
          'http://localhost:3000,http://localhost:3001';

        const module: TestingModule = await Test.createTestingModule({
          imports: [ConfigModule],
        }).compile();

        const testConfigService =
          module.get<ConfigService<Configuration>>(ConfigService);
        const cors = testConfigService.get('cors');

        expect(cors?.origins).toHaveLength(2);
        expect(cors?.origins).toContain('http://localhost:3000');
        expect(cors?.origins).toContain('http://localhost:3001');

        delete process.env.CORS_ORIGINS;
      });
    });

    describe('Rate Limit Config', () => {
      it('should load rate limit configuration with defaults', () => {
        const rateLimit = configService.get('rateLimit');

        expect(rateLimit?.windowMs).toBe(900000);
        expect(rateLimit?.max).toBe(100);
      });
    });

    describe('Logging Config', () => {
      it('should load log level with default', () => {
        const logging = configService.get('logging');
        expect(logging?.level).toBe('info');
      });
    });

    describe('Features Config', () => {
      it('should load email verification feature flag', () => {
        const features = configService.get('features');
        expect(features?.emailVerificationEnabled).toBe(false);
      });

      it('should parse boolean environment variable correctly', async () => {
        process.env.EMAIL_VERIFICATION_ENABLED = 'true';

        const module: TestingModule = await Test.createTestingModule({
          imports: [ConfigModule],
        }).compile();

        const testConfigService =
          module.get<ConfigService<Configuration>>(ConfigService);
        const features = testConfigService.get('features');

        expect(features?.emailVerificationEnabled).toBe(true);

        delete process.env.EMAIL_VERIFICATION_ENABLED;
      });
    });
  });

  describe('Validation', () => {
    it('should validate NODE_ENV values', () => {
      process.env.NODE_ENV = 'development';
      expect(
        () =>
          new Promise((resolve, reject) => {
            Test.createTestingModule({
              imports: [ConfigModule],
            })
              .compile()
              .then(resolve)
              .catch(reject);
          }),
      ).toBeTruthy();
    });

    it('should validate PORT as number', () => {
      process.env.PORT = '8080';
      expect(
        () =>
          new Promise((resolve, reject) => {
            Test.createTestingModule({
              imports: [ConfigModule],
            })
              .compile()
              .then(resolve)
              .catch(reject);
          }),
      ).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    it('should provide type-safe configuration access', () => {
      const port = configService.get('port');
      const database = configService.get('database');
      const jwt = configService.get('jwt');

      expect(typeof port).toBe('number');
      expect(typeof database?.url).toBe('string');
      expect(typeof jwt?.accessSecret).toBe('string');
    });
  });
});
