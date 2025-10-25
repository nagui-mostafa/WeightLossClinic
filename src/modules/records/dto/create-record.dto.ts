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
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicationName!: string;

  @ApiProperty({ enum: MedicationType })
  @IsEnum(MedicationType)
  medicationType!: MedicationType;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
