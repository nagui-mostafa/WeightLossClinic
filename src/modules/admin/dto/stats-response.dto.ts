import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsResponseDto {
  @ApiProperty()
  totalUsers!: number;

  @ApiProperty()
  activeUsers!: number;

  @ApiProperty()
  totalRecords!: number;

  @ApiProperty()
  newUsersLast7Days!: number;

  @ApiProperty()
  newUsersLast30Days!: number;

  @ApiProperty()
  recordsCreatedLast7Days!: number;

  @ApiProperty()
  recordsCreatedLast30Days!: number;
}
