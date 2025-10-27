import {
  ActivityKind,
  MedicationType,
  Role,
} from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  isEmailVerified!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class UserShippingDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  address1!: string;

  @ApiPropertyOptional()
  address2?: string | null;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty()
  postalCode!: string;

  @ApiProperty()
  country!: string;

  @ApiPropertyOptional()
  phone?: string | null;
}

export class UserSnapshotDoseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  value!: number;

  @ApiProperty()
  unit!: string;
}

export class UserSnapshotAppointmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  startsAt!: string;
}

export class UserSnapshotDto {
  @ApiPropertyOptional()
  currentWeightLbs?: number | null;

  @ApiPropertyOptional()
  goalWeightLbs?: number | null;

  @ApiPropertyOptional()
  medicationType?: string | null;

  @ApiPropertyOptional({ type: UserSnapshotDoseDto })
  dose?: UserSnapshotDoseDto | null;

  @ApiPropertyOptional({ type: UserSnapshotAppointmentDto })
  nextAppointment?: UserSnapshotAppointmentDto | null;
}

export class UserActivityDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ActivityKind })
  kind!: ActivityKind;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  subtitle?: string | null;

  @ApiProperty()
  occurredAt!: string;

  @ApiProperty()
  when!: string;
}

export class UserRecordDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  medication!: string;

  @ApiPropertyOptional({ enum: MedicationType })
  medicationType?: MedicationType | null;

  @ApiProperty()
  startDate!: string;

  @ApiPropertyOptional()
  endDate?: string | null;

  @ApiProperty()
  purchasedAt!: string;

  @ApiPropertyOptional()
  renewalDate?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class UserShotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  dateISO!: string;

  @ApiProperty()
  medication!: string;

  @ApiPropertyOptional()
  doseValue?: number | null;

  @ApiPropertyOptional()
  doseUnit?: string | null;

  @ApiPropertyOptional()
  site?: string | null;

  @ApiPropertyOptional()
  painLevel?: number | null;

  @ApiPropertyOptional()
  weightKg?: number | null;

  @ApiPropertyOptional()
  caloriesAvg?: number | null;

  @ApiPropertyOptional()
  proteinAvgG?: number | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class UserResponseDto {
  @ApiProperty({ type: UserProfileDto })
  profile!: UserProfileDto;

  @ApiPropertyOptional({ type: UserShippingDto })
  shipping?: UserShippingDto | null;

  @ApiPropertyOptional({ type: UserSnapshotDto })
  snapshot?: UserSnapshotDto | null;

  @ApiProperty({ type: [UserActivityDto] })
  activity!: UserActivityDto[];

  @ApiProperty({ type: [UserRecordDto] })
  records!: UserRecordDto[];

  @ApiProperty({ type: [UserShotDto] })
  shots!: UserShotDto[];
}
