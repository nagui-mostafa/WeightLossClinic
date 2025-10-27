import { MedicationType } from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  startDate!: string;

  @ApiPropertyOptional()
  endDate?: string | null;

  @ApiProperty()
  medication!: string;

  @ApiPropertyOptional({ enum: MedicationType })
  medicationType?: MedicationType | null;

  @ApiProperty()
  purchasedAt!: string;

  @ApiPropertyOptional()
  renewalDate?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
