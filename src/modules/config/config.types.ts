import { ConfigService } from '@nestjs/config';
import { Configuration } from './configuration';

/**
 * Typed ConfigService for type-safe configuration access
 *
 * @example
 * ```typescript
 * constructor(private configService: TypedConfigService) {
 *   const port = this.configService.get('port', { infer: true });
 *   const jwtSecret = this.configService.get('jwt.accessSecret', { infer: true });
 * }
 * ```
 */
export type TypedConfigService = ConfigService<Configuration, true>;
