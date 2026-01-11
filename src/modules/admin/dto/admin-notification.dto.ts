import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationStatus } from '@prisma/client';

export class AdminNotificationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ enum: NotificationStatus })
  status!: NotificationStatus;

  @ApiProperty()
  read!: boolean;

  @ApiPropertyOptional()
  dueDate?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiPropertyOptional()
  medication?: string | null;

  @ApiPropertyOptional()
  renewalDate?: string | null;

  @ApiPropertyOptional({ description: 'Days remaining to renewal (ceil), negative if past due' })
  daysRemaining?: number | null;
}
