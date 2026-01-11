import { MedicationType } from '../../common';
import { ProductCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordResponseDto {
  @ApiProperty({ example: 'rec_sarah_1' })
  id!: string;

  @ApiProperty({ example: 'd6c2a0f3-f3b9-4d7d-b8fd-6f1b1c5d2d4c' })
  userId!: string;

  @ApiProperty({ example: '2025-09-01T00:00:00.000Z' })
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  endDate?: string | null;

  @ApiProperty({ example: 'Semaglutide' })
  medication!: string;

  @ApiPropertyOptional({
    enum: MedicationType,
    example: MedicationType.INJECTABLE,
  })
  medicationType?: MedicationType | null;

  @ApiPropertyOptional({
    enum: ProductCategory,
    example: ProductCategory.WEIGHT_LOSS,
  })
  category?: ProductCategory | null;

  @ApiProperty({ example: '2025-09-01T10:20:00.000Z' })
  purchasedAt!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  renewalDate?: string | null;

  @ApiPropertyOptional({ example: 'Weekly injections with nutrition consult.' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '123456789012' })
  trackingNumber?: string | null;

  @ApiPropertyOptional({ example: 299.99, description: 'Plan price in USD' })
  price?: number | null;

  @ApiPropertyOptional({
    example: 4,
    description: 'Plan duration in weeks',
  })
  planDuration?: number | null;

  @ApiProperty({ example: '2025-09-01T10:20:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-09-20T08:22:00.000Z' })
  updatedAt!: string;
}
