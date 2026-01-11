import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsResponseDto {
  @ApiProperty({ example: 1200 })
  totalUsers!: number;

  @ApiProperty({
    example: 42,
    description: 'New patients created in last 7 days',
  })
  newUsers!: number;

  @ApiProperty({
    example: 310,
    description: 'Patients with plans overlapping the last 30 days',
  })
  activePatientsLast30Days!: number;

  @ApiProperty({
    example: 280,
    description: 'Patients currently marked as active (isActive=true)',
  })
  activePatients!: number;

  @ApiProperty({
    example: 275,
    description: 'Records created in the last 30 days',
  })
  orders!: number;

  @ApiProperty({ example: 0.68, description: 'Signup to purchase conversion' })
  conversion!: number;

  @ApiProperty({
    example: 0.42,
    description: 'Reminder efficacy: closed reminders / total reminders',
  })
  reminderEfficacy!: number;

  @ApiProperty({
    example: 120,
    description: 'Count of reminders that were closed after purchase',
  })
  closedReminders!: number;

  @ApiProperty({
    example: 285,
    description: 'Total reminders issued',
  })
  totalReminders!: number;

  @ApiProperty({
    example: 123456.78,
    description: 'Total revenue from record prices (null treated as 0)',
  })
  totalRevenue!: number;
}
