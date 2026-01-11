import { MedicationType } from '../../common';
import { ProductCategory, RecordStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateRecordDto {
  @ApiPropertyOptional({ example: 'Semaglutide' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  medication?: string;

  @ApiPropertyOptional({
    enum: MedicationType,
    example: MedicationType.INJECTABLE,
  })
  @IsOptional()
  @IsEnum(MedicationType)
  medicationType?: MedicationType;

  @ApiPropertyOptional({
    enum: ProductCategory,
    example: ProductCategory.WEIGHT_LOSS,
  })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @ApiPropertyOptional({
    enum: RecordStatus,
    example: RecordStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;

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

  @ApiPropertyOptional({ example: 299.99, description: 'Plan price in USD' })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Plan duration in weeks',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  planDuration?: number;

  @ApiPropertyOptional({
    maxLength: 1000,
    example: 'Weekly injections with nutrition consult.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Shipment tracking number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  trackingNumber?: string;
}
