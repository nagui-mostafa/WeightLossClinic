import { MedicationType, Role } from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRecordSummaryDto {
  @ApiProperty()
  id!: string;

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

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  weightLoss?: number | null;

  @ApiPropertyOptional()
  weightDose?: number | null;

  @ApiPropertyOptional()
  currentWeight?: number | null;

  @ApiPropertyOptional()
  goalWeight?: number | null;

  @ApiProperty()
  isEmailVerified!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [UserRecordSummaryDto] })
  records?: UserRecordSummaryDto[];
}
