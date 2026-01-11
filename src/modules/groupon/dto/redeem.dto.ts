import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsUUID } from 'class-validator';

export class GrouponRedeemDto {
  @ApiProperty({
    description: 'Reservation ID returned from lookup',
    example: 'e7a0f2c2-1234-4c5b-8f77-9e0c8f2b1caa',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @MaxLength(64)
  reservationId!: string;
}

export class GrouponRedeemResponseDto {
  @ApiProperty({ example: 'redeemed' })
  status!: string;

  @ApiProperty({ example: '2025-12-11T19:30:00.000Z' })
  redeemedAt!: string;
}
