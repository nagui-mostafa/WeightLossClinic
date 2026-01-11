import { ApiProperty } from '@nestjs/swagger';

export class AdminAnalyticsResponseDto {
  @ApiProperty({ example: 1200 })
  totalPatients!: number;

  @ApiProperty({ example: 42 })
  newPatientsLast7Days!: number;

  @ApiProperty({
    example: 310,
    description: 'Patients who had a valid plan overlapping the last 30 days',
  })
  activePatientsLast30Days!: number;

  @ApiProperty({ example: 275 })
  ordersLast30Days!: number;

  @ApiProperty({ example: 0.68, description: 'Purchase conversion rate (0-1)' })
  signupToPurchaseConversion!: number;

  @ApiProperty({
    example: 0.42,
    description: 'Reminder efficacy: closed reminders / total reminders',
  })
  reminderEfficacy!: number;

  @ApiProperty({ example: 120 })
  closedReminders!: number;

  @ApiProperty({ example: 285 })
  totalReminders!: number;
}
