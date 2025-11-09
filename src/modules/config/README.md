# Configuration Module

A production-ready configuration module for the Weight Loss Clinic application using NestJS ConfigModule with Joi validation.

## Features

- Global module available throughout the application
- Type-safe configuration with TypeScript interfaces
- Environment variable validation using Joi
- Support for multiple environment files (.env.local, .env)
- Structured configuration object with nested properties
- Comprehensive validation for all required variables

## Installation

The module is already installed with the following dependencies:
- `@nestjs/config`: NestJS configuration module
- `@hapi/joi`: Schema validation library

## Usage

### Importing the Module

The ConfigModule is a global module and is automatically available after importing it once in your root AppModule:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from './modules/config';

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

### Accessing Configuration

#### Method 1: Using ConfigService

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './modules/config';

@Injectable()
export class SomeService {
  constructor(private configService: ConfigService<Configuration>) {}

  someMethod() {
    // Access top-level properties directly
    const port = this.configService.get('port', { infer: true });

    // Access nested properties through their parent object
    const database = this.configService.get('database', { infer: true });
    const dbUrl = database?.url;

    const jwt = this.configService.get('jwt', { infer: true });
    const jwtSecret = jwt?.accessSecret;
  }
}
```

#### Method 2: Using TypedConfigService (Recommended)

```typescript
import { Injectable } from '@nestjs/common';
import { TypedConfigService } from './modules/config';

@Injectable()
export class SomeService {
  constructor(private configService: TypedConfigService) {}

  someMethod() {
    // Type-safe access with IntelliSense
    const port = this.configService.get('port', { infer: true });

    // Access nested configuration objects
    const database = this.configService.get('database', { infer: true });
    const dbUrl = database?.url;

    const jwt = this.configService.get('jwt', { infer: true });
    const accessSecret = jwt?.accessSecret;
    const refreshSecret = jwt?.refreshSecret;
  }
}
```

## Configuration Structure

### Application Configuration
- `NODE_ENV`: Environment (development, production, test)
- `PORT`: Server port (default: 3000)

### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)

### JWT Configuration
- `JWT_ACCESS_SECRET`: Secret for access tokens (required)
- `JWT_REFRESH_SECRET`: Secret for refresh tokens (required)
- `ACCESS_TOKEN_TTL`: Access token expiration (default: 3d)
- `REFRESH_TOKEN_TTL`: Refresh token expiration (default: 14d)
- `PASSWORD_RESET_TOKEN_TTL`: Password reset token expiration (default: 1h)
- `EMAIL_VERIFICATION_TOKEN_TTL`: Email verification token expiration (default: 24h)

### Email Configuration
- `MAIL_HOST`: SMTP host (default: localhost)
- `MAIL_PORT`: SMTP port (default: 587)
- `MAIL_USER`: SMTP username
- `MAIL_PASS`: SMTP password
- `MAIL_FROM`: From email address (default: noreply@weightlossclinic.com)

### Security Configuration
- `CORS_ORIGINS`: Comma-separated allowed origins (default: http://localhost:3000)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 900000)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)

### Logging Configuration
- `LOG_LEVEL`: Logging level (fatal, error, warn, info, debug, trace) (default: info)

### Feature Flags
- `EMAIL_VERIFICATION_ENABLED`: Enable email verification (default: false)

## Validation Schema

All environment variables are validated on application startup. The validation schema ensures:

1. Required variables are present (DATABASE_URL, JWT secrets)
2. Enum values are correct (NODE_ENV, LOG_LEVEL)
3. Numbers are properly parsed (PORT, MAIL_PORT, rate limit values)
4. Booleans are correctly interpreted
5. Email addresses are valid (MAIL_FROM)

If validation fails, the application will not start and will display detailed error messages.

## Environment Files

The module looks for environment files in this order:
1. `.env.local` (highest priority, not committed to git)
2. `.env` (committed to git with dummy values)

## Example .env File

See `.env.example` in the project root for a complete example of all configuration options.

## Type Safety

The module provides full TypeScript support with:

- `Configuration` interface: Complete type definitions for all config values
- `TypedConfigService`: Type-safe wrapper around ConfigService
- Nested property access with IntelliSense support

## Testing

To test the configuration module:

```bash
npm test -- config.module.spec
```

The test suite covers:
- Module initialization
- Default values
- Environment variable parsing
- Type safety
- Validation

## Best Practices

1. **Never commit sensitive values**: Use `.env.local` for local development secrets
2. **Use TypedConfigService**: For better type safety and IntelliSense
3. **Set required variables**: Always set DATABASE_URL and JWT secrets
4. **Use environment-specific files**: Create `.env.production`, `.env.test` as needed
5. **Validate early**: Configuration errors are caught at startup, not runtime
6. **Document new variables**: Update this README when adding new configuration options

## Adding New Configuration

To add new configuration options:

1. Add the environment variable to `config.module.ts` validation schema:
```typescript
validationSchema: Joi.object({
  // ... existing validation
  NEW_VARIABLE: Joi.string().required(),
}),
```

2. Update the `Configuration` interface in `configuration.ts`:
```typescript
export interface Configuration {
  // ... existing properties
  newFeature: {
    variable: string;
  };
}
```

3. Add the mapping in the configuration factory:
```typescript
export default (): Configuration => ({
  // ... existing config
  newFeature: {
    variable: process.env.NEW_VARIABLE || 'default',
  },
});
```

4. Update `.env.example` with the new variable
5. Update this README with documentation

## Troubleshooting

### Application won't start with validation errors

Check that all required environment variables are set:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Configuration values not loading

1. Verify the `.env` file is in the project root
2. Check for typos in environment variable names
3. Ensure the application is restarted after changing `.env` values

### Type errors when accessing configuration

Use the `TypedConfigService` type and enable `infer: true` option:
```typescript
const port = this.configService.get('port', { infer: true });
const jwt = this.configService.get('jwt', { infer: true });
```

Note: NestJS ConfigService requires accessing nested properties through their parent object, not via dot notation.
