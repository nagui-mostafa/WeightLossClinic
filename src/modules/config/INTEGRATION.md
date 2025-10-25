# Configuration Module Integration Guide

This guide shows how to integrate the ConfigModule into your NestJS application.

## Quick Start

### Step 1: Import ConfigModule in AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/config';

@Module({
  imports: [
    ConfigModule, // Import once at the root level
    // ... other modules
  ],
})
export class AppModule {}
```

### Step 2: Create .env file

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required environment variables:**
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Step 3: Use Configuration in Your Services

```typescript
// src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { TypedConfigService } from '../config';

@Injectable()
export class AuthService {
  constructor(private configService: TypedConfigService) {}

  getJwtConfig() {
    const jwt = this.configService.get('jwt', { infer: true });
    return {
      accessSecret: jwt?.accessSecret,
      accessTokenTTL: jwt?.accessTokenTTL,
    };
  }
}
```

## Advanced Integration Examples

### Database Module Configuration

```typescript
// src/modules/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (configService: ConfigService) => {
        const database = configService.get('database');
        return new PrismaService(database?.url);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

### JWT Module Configuration

```typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Configuration } from '../config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService<Configuration>) => {
        const jwt = configService.get('jwt');
        return {
          secret: jwt?.accessSecret,
          signOptions: { expiresIn: jwt?.accessTokenTTL },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
```

### Throttler (Rate Limiting) Configuration

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ConfigModule, Configuration } from './modules/config';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService<Configuration>) => {
        const rateLimit = configService.get('rateLimit');
        return [
          {
            ttl: rateLimit?.windowMs || 60000,
            limit: rateLimit?.max || 10,
          },
        ];
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Main Application Bootstrap

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Configuration } from './modules/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get ConfigService from the app
  const configService = app.get<ConfigService<Configuration>>(ConfigService);

  // Use configuration values
  const port = configService.get('port');
  const nodeEnv = configService.get('nodeEnv');
  const cors = configService.get('cors');

  // Setup CORS
  app.enableCors({
    origin: cors?.origins || [],
    credentials: true,
  });

  await app.listen(port || 3000);
  console.log(`Application running in ${nodeEnv} mode on port ${port}`);
}

bootstrap();
```

### CORS Configuration

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // CORS
  const cors = configService.get('cors');
  app.enableCors({
    origin: cors?.origins,
    credentials: true,
  });

  // Start server
  const port = configService.get('port');
  await app.listen(port);
}

bootstrap();
```

### Environment-Specific Logic

```typescript
// src/modules/logging/logging.service.ts
import { Injectable } from '@nestjs/common';
import { TypedConfigService } from '../config';

@Injectable()
export class LoggingService {
  private readonly isProduction: boolean;
  private readonly logLevel: string;

  constructor(private configService: TypedConfigService) {
    const nodeEnv = this.configService.get('nodeEnv', { infer: true });
    this.isProduction = nodeEnv === 'production';

    const logging = this.configService.get('logging', { infer: true });
    this.logLevel = logging?.level || 'info';
  }

  log(message: string) {
    if (!this.isProduction) {
      console.log(`[${this.logLevel}] ${message}`);
    }
  }
}
```

## Common Patterns

### 1. Configuration Validation on Startup

```typescript
// src/app.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './modules/config';

@Module({
  imports: [ConfigModule],
})
export class AppModule implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Validate required configurations
    const database = this.configService.get('database');
    const jwt = this.configService.get('jwt');

    if (!database?.url) {
      throw new Error('DATABASE_URL is required');
    }

    if (!jwt?.accessSecret || !jwt?.refreshSecret) {
      throw new Error('JWT secrets are required');
    }

    console.log('Configuration validated successfully');
  }
}
```

### 2. Feature Flags

```typescript
// src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { TypedConfigService } from '../config';

@Injectable()
export class AuthService {
  constructor(private configService: TypedConfigService) {}

  async registerUser(email: string) {
    const features = this.configService.get('features', { infer: true });

    if (features?.emailVerificationEnabled) {
      // Send verification email
      await this.sendVerificationEmail(email);
    } else {
      // Auto-verify the user
      await this.autoVerifyUser(email);
    }
  }
}
```

### 3. Type-Safe Configuration Access

```typescript
// Always use TypedConfigService for better type safety
import { TypedConfigService } from './modules/config';

@Injectable()
export class MyService {
  constructor(private config: TypedConfigService) {
    // Type-safe with IntelliSense
    const jwt = this.config.get('jwt', { infer: true });
    // jwt is properly typed as Configuration['jwt'] | undefined
  }
}
```

## Troubleshooting

### Application won't start

**Error:** "ValidationError: DATABASE_URL is required"

**Solution:** Make sure all required environment variables are set in your `.env` file:
- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET

### Configuration values not loading

1. Check that `.env` file exists in project root
2. Verify environment variable names match exactly (case-sensitive)
3. Restart the application after changing `.env`
4. For production, ensure environment variables are set in your hosting platform

### TypeScript errors

Make sure to use the configuration objects, not dot notation:

```typescript
// Wrong ❌
const dbUrl = this.config.get('database.url');

// Correct ✅
const database = this.config.get('database');
const dbUrl = database?.url;
```

## Testing with ConfigModule

```typescript
// test/integration/config.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { ConfigModule } from '../../src/modules/config';
import { ConfigService } from '@nestjs/config';

describe('Configuration Integration', () => {
  let configService: ConfigService;

  beforeAll(async () => {
    // Set test environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_ACCESS_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = moduleRef.get(ConfigService);
  });

  it('should load configuration', () => {
    const port = configService.get('port');
    expect(port).toBe(3000);
  });
});
```

## Best Practices

1. **Use TypedConfigService**: Always prefer `TypedConfigService` over plain `ConfigService`
2. **Access nested properties safely**: Use optional chaining (`?.`) when accessing nested config
3. **Validate early**: Validate required configuration on application startup
4. **Use .env.local for secrets**: Never commit `.env.local` to version control
5. **Document new variables**: Update `.env.example` when adding new configuration options
6. **Use feature flags**: Enable/disable features through configuration
7. **Environment-specific configs**: Use different values for dev/staging/production

## Next Steps

- See [README.md](./README.md) for complete configuration reference
- Check [config.module.spec.ts](./__tests__/config.module.spec.ts) for testing examples
- Review `.env.example` for all available configuration options
