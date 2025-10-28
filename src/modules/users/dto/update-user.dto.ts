import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityKind, MedicationType } from '../../common';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    example: '+14155552671',
    description: 'Phone number (format not enforced)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateUserShippingDto {
  @ApiPropertyOptional({ example: 'Sarah Adams' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: '123 Ocean Ave' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address1?: string;

  @ApiPropertyOptional({ example: 'Unit 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address2?: string;

  @ApiPropertyOptional({ example: 'Miami' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ example: 'FL' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiPropertyOptional({ example: '33101' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiPropertyOptional({
    example: '+1 (555) 010-2000',
    description: 'Free-form contact number for shipping updates',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateUserSnapshotDoseDto {
  @ApiPropertyOptional({ example: 'Semaglutide' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 1.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @IsPositive()
  value?: number;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;
}

export class UpdateUserSnapshotAppointmentDto {
  @ApiPropertyOptional({ example: 'apt_2025_10_20' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  id?: string;

  @ApiPropertyOptional({ example: '2025-10-20T14:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;
}

export class UpdateUserSnapshotDto {
  @ApiPropertyOptional({ example: 165 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  currentWeightLbs?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  goalWeightLbs?: number;

  @ApiPropertyOptional({ example: 'Semaglutide' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  medicationType?: string;

  @ApiPropertyOptional({ type: UpdateUserSnapshotDoseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserSnapshotDoseDto)
  dose?: UpdateUserSnapshotDoseDto | null;

  @ApiPropertyOptional({ type: UpdateUserSnapshotAppointmentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserSnapshotAppointmentDto)
  nextAppointment?: UpdateUserSnapshotAppointmentDto | null;
}

export class UpdateUserActivityDto {
  @ApiPropertyOptional({ description: 'Existing activity id for updates' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ enum: ActivityKind, example: ActivityKind.INJECTION })
  @IsEnum(ActivityKind)
  kind!: ActivityKind;

  @ApiProperty({ example: 'Logged injection' })
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: '1.0 mg Semaglutide' })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  subtitle?: string;

  @ApiProperty({ example: '2025-10-24T10:00:00.000Z' })
  @IsDateString()
  occurredAt!: string;
}

export class UpdateUserRecordDto {
  @ApiPropertyOptional({ description: 'Existing record id for updates' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Semaglutide' })
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
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

  @ApiPropertyOptional({ example: 'Take with food.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateUserShotDto {
  @ApiPropertyOptional({ description: 'Existing shot id for updates' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ example: '2025-08-18T10:59:00.000Z' })
  @IsDateString()
  dateISO!: string;

  @ApiProperty({ example: 'Tirzepatide' })
  @IsString()
  @MaxLength(150)
  @IsNotEmpty()
  medication!: string;

  @ApiPropertyOptional({ example: 7.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  doseValue?: number;

  @ApiPropertyOptional({ example: 'mg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  doseUnit?: string;

  @ApiPropertyOptional({ example: 'Stomach - Upper Left' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  site?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel?: number;

  @ApiPropertyOptional({ example: 89.3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(400)
  weightKg?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  caloriesAvg?: number;

  @ApiPropertyOptional({ example: 89 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1000)
  proteinAvgG?: number;

  @ApiPropertyOptional({ example: 'Felt fine.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    type: UpdateUserProfileDto,
    example: {
      firstName: 'Sarah',
      lastName: 'Adams',
      phone: '+1 (555) 010-2000',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserProfileDto)
  profile?: UpdateUserProfileDto;

  @ApiPropertyOptional({
    type: UpdateUserShippingDto,
    nullable: true,
    example: {
      fullName: 'Sarah Adams',
      address1: '123 Ocean Ave',
      address2: 'Unit 4B',
      city: 'Miami',
      state: 'FL',
      postalCode: '33101',
      country: 'USA',
      phone: '+1 (555) 010-2000',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserShippingDto)
  shipping?: UpdateUserShippingDto | null;

  @ApiPropertyOptional({
    type: UpdateUserSnapshotDto,
    nullable: true,
    example: {
      currentWeightLbs: 165,
      goalWeightLbs: 150,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 1.0, unit: 'mg' },
      nextAppointment: {
        id: 'apt_sarah_2025_10_20',
        startsAt: '2025-10-20T14:00:00.000Z',
      },
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserSnapshotDto)
  snapshot?: UpdateUserSnapshotDto | null;

  @ApiPropertyOptional({
    type: [UpdateUserActivityDto],
    example: [
      {
        kind: 'INJECTION',
        title: 'Logged injection',
        subtitle: '1.0 mg Semaglutide',
        occurredAt: '2025-10-24T10:00:00.000Z',
      },
      {
        kind: 'WEIGHT',
        title: 'Logged weight',
        subtitle: '165 lbs',
        occurredAt: '2025-10-23T11:20:00.000Z',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserActivityDto)
  activity?: UpdateUserActivityDto[];

  @ApiPropertyOptional({
    type: [UpdateUserRecordDto],
    example: [
      {
        medication: 'Semaglutide',
        medicationType: 'INJECTABLE',
        startDate: '2025-09-01T00:00:00.000Z',
        endDate: '2025-11-24T00:00:00.000Z',
        purchasedAt: '2025-09-01T10:20:00.000Z',
        renewalDate: '2025-11-24T00:00:00.000Z',
        notes: 'Weekly injections with nutrition consult.',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserRecordDto)
  records?: UpdateUserRecordDto[];

  @ApiPropertyOptional({
    type: [UpdateUserShotDto],
    example: [
      {
        dateISO: '2025-08-18T10:59:00.000Z',
        medication: 'Tirzepatide',
        doseValue: 7.5,
        doseUnit: 'mg',
        site: 'Stomach - Upper Left',
        painLevel: 1,
        weightKg: 89.3,
        caloriesAvg: 2000,
        proteinAvgG: 89,
        notes: 'Felt fine.',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserShotDto)
  shots?: UpdateUserShotDto[];
}
