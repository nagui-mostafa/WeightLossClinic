import { MedicationType } from '../../common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListRecordsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by userId (admin only)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: MedicationType })
  @IsOptional()
  @IsEnum(MedicationType)
  medicationType?: MedicationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort expression, e.g. startDate:desc',
    example: 'startDate:desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}
