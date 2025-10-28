import { MedicationType } from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRecordDto {
  @ApiPropertyOptional({
    description: 'Required for admins to create records for a specific patient',
    example: 'd6c2a0f3-f3b9-4d7d-b8fd-6f1b1c5d2d4c',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'Semaglutide' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medication!: string;

  @ApiPropertyOptional({ enum: MedicationType, example: MedicationType.INJECTABLE })
  @IsOptional()
  @IsEnum(MedicationType)
  medicationType?: MedicationType;

  @ApiProperty({ example: '2025-09-01T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: '2025-09-01T10:20:00.000Z' })
  @IsDateString()
  purchasedAt!: string;

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
