import { Role } from '../../common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value, obj }) => {
    const raw = obj?.isActive ?? value;
    if (raw === undefined || raw === null || raw === '') {
      return undefined;
    }
    if (typeof raw === 'boolean') {
      return raw;
    }
    if (typeof raw === 'string') {
      const normalized = raw.toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
      if (normalized === '1') {
        return true;
      }
      if (normalized === '0') {
        return false;
      }
    }
    return Boolean(raw);
  })
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by email substring' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Sort expression e.g. createdAt:desc' })
  @IsOptional()
  @IsString()
  sort?: string;
}
