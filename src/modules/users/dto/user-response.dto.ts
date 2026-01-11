import { ActivityKind, MedicationType, Role } from '../../common';
import { ProductCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminStatsResponseDto } from '../../admin/dto/stats-response.dto';

export class UserNotificationRecordDto {
  @ApiProperty({ example: 'rec_sarah_1' })
  id!: string;

  @ApiProperty({ example: 'Semaglutide' })
  medication!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  renewalDate?: string | null;
}

export class UserNotificationDto {
  @ApiProperty({ example: 'notif_01' })
  id!: string;

  @ApiProperty({ example: 'Renewal reminder' })
  title!: string;

  @ApiProperty({
    example: 'Your Semaglutide plan renews on 2025-11-24.',
  })
  message!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  dueDate?: string | null;

  @ApiProperty({ example: false })
  read!: boolean;

  @ApiPropertyOptional({ type: UserNotificationRecordDto })
  record?: UserNotificationRecordDto | null;

  @ApiProperty({ enum: ['ACTIVE', 'PROCESSING', 'CLOSED'], example: 'ACTIVE' })
  status!: 'ACTIVE' | 'PROCESSING' | 'CLOSED';

  @ApiPropertyOptional({ example: 'Sarah Adams' })
  fullName?: string;

  @ApiPropertyOptional({ example: 'sarah.adams@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+1 (555) 010-2000' })
  phone?: string | null;
}

export class UserProfileDto {
  @ApiProperty({ example: 'd6c2a0f3-f3b9-4d7d-b8fd-6f1b1c5d2d4c' })
  id!: string;

  @ApiProperty({ example: 'Sarah' })
  firstName!: string;

  @ApiProperty({ example: 'Adams' })
  lastName!: string;

  @ApiProperty({ example: 'sarah.adams@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+1 (555) 010-2000' })
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'https://i.pravatar.cc/150?img=1',
  })
  avatarUrl?: string | null;

  @ApiProperty({ enum: Role, example: Role.PATIENT })
  role!: Role;

  @ApiProperty({ example: true })
  isEmailVerified!: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the patient currently has an active plan',
  })
  isActive!: boolean;

  @ApiProperty({ example: '2025-10-25T15:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2025-10-26T08:30:00.000Z' })
  updatedAt!: string;
}

export class UserShippingDto {
  @ApiProperty({ example: 'a1d3f4e5-3d25-4d3b-8b52-4a0ebd24d9b5' })
  id!: string;

  @ApiProperty({ example: 'Sarah Adams' })
  fullName!: string;

  @ApiProperty({ example: '123 Ocean Ave' })
  address1!: string;

  @ApiPropertyOptional({ example: 'Unit 4B' })
  address2?: string | null;

  @ApiProperty({ example: 'Miami' })
  city!: string;

  @ApiProperty({ example: 'FL' })
  state!: string;

  @ApiProperty({ example: '33101' })
  postalCode!: string;

  @ApiProperty({ example: 'USA' })
  country!: string;

  @ApiPropertyOptional({ example: '+1 (555) 010-2000' })
  phone?: string | null;
}

export class UserSnapshotDoseDto {
  @ApiProperty({ example: 'Semaglutide' })
  name!: string;

  @ApiProperty({ example: 1.0 })
  value!: number;

  @ApiProperty({ example: 'mg' })
  unit!: string;
}

export class UserSnapshotAppointmentDto {
  @ApiProperty({ example: 'apt_sarah_2025_10_20' })
  id!: string;

  @ApiProperty({ example: '2025-10-20T14:00:00.000Z' })
  startsAt!: string;
}

export class UserSnapshotDto {
  @ApiPropertyOptional({ example: 165 })
  currentWeightLbs?: number | null;

  @ApiPropertyOptional({ example: 150 })
  goalWeightLbs?: number | null;

  @ApiPropertyOptional({ example: 'Semaglutide' })
  medicationType?: string | null;

  @ApiPropertyOptional({ type: UserSnapshotDoseDto })
  dose?: UserSnapshotDoseDto | null;

  @ApiPropertyOptional({ type: UserSnapshotAppointmentDto })
  nextAppointment?: UserSnapshotAppointmentDto | null;
}

export class UserActivityDto {
  @ApiProperty({ example: 'act_sarah_1' })
  id!: string;

  @ApiProperty({ enum: ActivityKind, example: ActivityKind.INJECTION })
  kind!: ActivityKind;

  @ApiProperty({ example: 'Logged injection' })
  title!: string;

  @ApiPropertyOptional({ example: '1.0 mg Semaglutide' })
  subtitle?: string | null;

  @ApiProperty({ example: '2025-10-24T10:00:00.000Z' })
  occurredAt!: string;

  @ApiProperty({ example: '2 days ago' })
  when!: string;
}

export class UserRecordDto {
  @ApiProperty({ example: 'rec_sarah_1' })
  id!: string;

  @ApiProperty({ example: 'Semaglutide' })
  medication!: string;

  @ApiPropertyOptional({ enum: MedicationType })
  medicationType?: MedicationType | null;

  @ApiPropertyOptional({ enum: ProductCategory })
  category?: ProductCategory | null;

  @ApiProperty({ example: '2025-09-01T00:00:00.000Z' })
  startDate!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  endDate?: string | null;

  @ApiProperty({ example: '2025-09-01T10:20:00.000Z' })
  purchasedAt!: string;

  @ApiPropertyOptional({ example: '2025-11-24T00:00:00.000Z' })
  renewalDate?: string | null;

  @ApiPropertyOptional({ example: 'Weekly injections with nutrition consult.' })
  notes?: string | null;

  @ApiPropertyOptional({ example: '123456789012' })
  trackingNumber?: string | null;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'COMPLETED', 'CANCELED'],
    example: 'ACTIVE',
  })
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELED';

  @ApiPropertyOptional({ example: 299.99, description: 'Plan price in USD' })
  price?: number | null;

  @ApiPropertyOptional({
    example: 4,
    description: 'Plan duration in weeks',
  })
  planDuration?: number | null;
}

export class UserShotDto {
  @ApiProperty({ example: 'shot_sarah_1' })
  id!: string;

  @ApiProperty({ example: '2025-08-18T10:59:00.000Z' })
  dateISO!: string;

  @ApiProperty({ example: 'Tirzepatide' })
  medication!: string;

  @ApiPropertyOptional({ example: 7.5 })
  doseValue?: number | null;

  @ApiPropertyOptional({ example: 'mg' })
  doseUnit?: string | null;

  @ApiPropertyOptional({ example: 'Stomach - Upper Left' })
  site?: string | null;

  @ApiPropertyOptional({ example: 1 })
  painLevel?: number | null;

  @ApiPropertyOptional({ example: 89.3 })
  weightKg?: number | null;

  @ApiPropertyOptional({ example: 2000 })
  caloriesAvg?: number | null;

  @ApiPropertyOptional({ example: 89 })
  proteinAvgG?: number | null;

  @ApiPropertyOptional({ example: 'Felt fine.' })
  notes?: string | null;
}

export class UserResponseDto {
  @ApiProperty({
    type: UserProfileDto,
    example: {
      id: 'd6c2a0f3-f3b9-4d7d-b8fd-6f1b1c5d2d4c',
      firstName: 'Sarah',
      lastName: 'Adams',
      email: 'sarah.adams@example.com',
      phone: '+1 (555) 010-2000',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      role: 'PATIENT',
      isEmailVerified: true,
      isActive: true,
      createdAt: '2025-10-25T15:00:00.000Z',
      updatedAt: '2025-10-26T08:30:00.000Z',
    },
  })
  profile!: UserProfileDto;

  @ApiPropertyOptional({
    type: UserShippingDto,
    example: {
      id: 'a1d3f4e5-3d25-4d3b-8b52-4a0ebd24d9b5',
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
  shipping?: UserShippingDto | null;

  @ApiPropertyOptional({
    type: UserSnapshotDto,
    example: {
      currentWeightLbs: 165,
      goalWeightLbs: 150,
      medicationType: 'Semaglutide',
      dose: { name: 'Semaglutide', value: 1, unit: 'mg' },
      nextAppointment: {
        id: 'apt_sarah_2025_10_20',
        startsAt: '2025-10-20T14:00:00.000Z',
      },
    },
  })
  snapshot?: UserSnapshotDto | null;

  @ApiProperty({
    type: [UserActivityDto],
    example: [
      {
        id: 'act_sarah_1',
        kind: 'INJECTION',
        title: 'Logged injection',
        subtitle: '1.0 mg Semaglutide',
        occurredAt: '2025-10-24T10:00:00.000Z',
        when: '2 days ago',
      },
      {
        id: 'act_sarah_2',
        kind: 'WEIGHT',
        title: 'Logged weight',
        subtitle: '165 lbs',
        occurredAt: '2025-10-23T11:20:00.000Z',
        when: '3 days ago',
      },
    ],
  })
  activity!: UserActivityDto[];

  @ApiProperty({
    type: [UserRecordDto],
    example: [
      {
        id: 'rec_sarah_1',
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
  records!: UserRecordDto[];

  @ApiProperty({
    type: [UserShotDto],
    example: [
      {
        id: 'shot_sarah_1',
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
  shots!: UserShotDto[];

  @ApiProperty({
    type: [UserNotificationDto],
    example: [
      {
        id: 'notif_sarah_1',
        title: 'Renewal reminder',
        message: 'Your Semaglutide plan renews on 2025-11-24.',
        dueDate: '2025-11-24T00:00:00.000Z',
        read: false,
        record: {
          id: 'rec_sarah_1',
          medication: 'Semaglutide',
          renewalDate: '2025-11-24T00:00:00.000Z',
        },
      },
    ],
  })
  notifications!: UserNotificationDto[];

  @ApiPropertyOptional({ type: AdminStatsResponseDto })
  adminStats?: AdminStatsResponseDto;
}
