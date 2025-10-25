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
  medicationName!: string;

  @ApiProperty({ enum: MedicationType })
  medicationType!: MedicationType;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
