import { MedicationType } from '../../common';
import { ProductCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';

export class CreateRecordDto {
  @ApiPropertyOptional({
    description: 'Required for admins to create records for a specific patient',
    example: 'd6c2a0f3-f3b9-4d7d-b8fd-6f1b1c5d2d4c',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Reservation ID returned from Groupon lookup',
    example: 'e7a0f2c2-1234-4c5b-8f77-9e0c8f2b1caa',
  })
  @IsOptional()
  @IsString()
  voucherReservationId?: string;

  @ApiProperty({ example: 'Semaglutide' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medication!: string;

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
    description: 'Optional shipment tracking number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  trackingNumber?: string;
}
