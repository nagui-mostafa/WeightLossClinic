import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY, Role, ROLES_KEY } from '../../common';
import { PrismaService } from '../../common/services/prisma.service';
import type { AuthenticatedUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly adminApiKeys: Set<string>;
  private adminActorCache?: AuthenticatedUser;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super();
    this.adminApiKeys = this.loadAdminApiKeys();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.isPublicRoute(context);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Allow admin API key on any non-public route (treat as admin)
    const apiKey = this.extractAdminApiKey(context);
    if (apiKey && this.adminApiKeys.has(apiKey)) {
      const request = context.switchToHttp().getRequest();
      request.user = await this.resolveAdminActor();
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException(info?.message);
    }
    return user;
  }

  private isPublicRoute(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  private loadAdminApiKeys(): Set<string> {
    const multi = this.configService
      .get<string>('ADMIN_API_KEYS', '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const single = this.configService.get<string>('ADMIN_API_KEY', '').trim();

    return new Set(single ? [single, ...multi] : multi);
  }

  private extractAdminApiKey(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const header =
      request.headers['x-admin-api-key'] ?? request.headers['x-api-key'];

    if (Array.isArray(header)) {
      return header[0]?.trim();
    }

    if (typeof header === 'string') {
      return header.trim();
    }

    return undefined;
  }

  private async resolveAdminActor(): Promise<AuthenticatedUser> {
    if (this.adminActorCache) {
      return this.adminActorCache;
    }

    const actorId = this.configService
      .get<string>('ADMIN_API_KEY_ACTOR_ID', '')
      .trim();

    const actor =
      (actorId
        ? await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { id: true, email: true, role: true },
          })
        : null) ??
      (await this.prisma.user.findFirst({
        where: { role: Role.ADMIN },
        select: { id: true, email: true, role: true },
      }));

    if (!actor) {
      throw new UnauthorizedException('Admin API key actor not found');
    }

    this.adminActorCache = {
      id: actor.id,
      role: actor.role as Role,
      email: actor.email,
      sessionId: 'admin-api-key',
    };

    return this.adminActorCache;
  }
}
