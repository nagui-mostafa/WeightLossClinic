import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '../../common';

export class AuditLogResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: AuditAction })
  action!: AuditAction;

  @ApiPropertyOptional()
  actorUserId?: string | null;

  @ApiPropertyOptional()
  targetUserId?: string | null;

  @ApiProperty()
  entityType!: string;

  @ApiPropertyOptional()
  entityId?: string | null;

  @ApiPropertyOptional({ description: 'JSON metadata stringified' })
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional()
  ip?: string | null;

  @ApiPropertyOptional()
  userAgent?: string | null;

  @ApiProperty()
  createdAt!: string;
}
