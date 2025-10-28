import { MedicationType } from '../../common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateRecordDto {
  @ApiPropertyOptional({ example: 'Semaglutide' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  medication?: string;

  @ApiPropertyOptional({ enum: MedicationType, example: MedicationType.INJECTABLE })
  @IsOptional()
  @IsEnum(MedicationType)
  medicationType?: MedicationType;

  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '2025-09-01T10:20:00.000Z' })
  @IsOptional()
  @IsDateString()
  purchasedAt?: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional({ maxLength: 1000, example: 'Weekly injections with nutrition consult.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
