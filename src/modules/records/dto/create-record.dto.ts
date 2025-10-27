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
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medication!: string;

  @ApiPropertyOptional({ enum: MedicationType })
  @IsOptional()
  @IsEnum(MedicationType)
  medicationType?: MedicationType;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsDateString()
  purchasedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  renewalDate?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
