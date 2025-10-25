import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token issued during login or signup',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
