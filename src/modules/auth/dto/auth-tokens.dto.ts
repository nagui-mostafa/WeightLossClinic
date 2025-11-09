import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNmMyYTBmMy1mM2I5LTRkN2QtYjhmZC02ZjFiMWM1ZDJkNGMiLCJpYXQiOjE3MzAwMDQwMDAsImV4cCI6MTczMDAwNzYwMH0.T2ZKfT1mP4U1uo3tY5GpM8P-1Dw3w0S2-MF08nTqVgk',
  })
  accessToken!: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNmMyYTBmMy1mM2I5LTRkN2QtYjhmZC02ZjFiMWM1ZDJkNGMiLCJzaWQiOiI5Y2RhNzY5NS0zNmMxLTRkNjEtYmYzNS04ZTVlM2JjNzhlYjgiLCJpYXQiOjE3MzAwMDQwMDAsImV4cCI6MTczMDYwODQwMH0.YJz9ncSC0iZM2rVv4J4Kp0gKXaj6LzBfx5cL3l8m7bw',
  })
  refreshToken!: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 259200,
  })
  expiresIn!: number;

  @ApiProperty({
    description: 'Refresh token expiration time in seconds',
    example: 1209600,
  })
  refreshExpiresIn!: number;
}

export class AuthResponseDto {
  @ApiPropertyOptional({
    type: AuthTokensDto,
    example: {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNmMyYTBmMy1mM2I5LTRkN2QtYjhmZC02ZjFiMWM1ZDJkNGMiLCJpYXQiOjE3MzAwMDQwMDAsImV4cCI6MTczMDAwNzYwMH0.T2ZKfT1mP4U1uo3tY5GpM8P-1Dw3w0S2-MF08nTqVgk',
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNmMyYTBmMy1mM2I5LTRkN2QtYjhmZC02ZjFiMWM1ZDJkNGMiLCJzaWQiOiI5Y2RhNzY5NS0zNmMxLTRkNjEtYmYzNS04ZTVlM2JjNzhlYjgiLCJpYXQiOjE3MzAwMDQwMDAsImV4cCI6MTczMDYwODQwMH0.YJz9ncSC0iZM2rVv4J4Kp0gKXaj6LzBfx5cL3l8m7bw',
      expiresIn: 259200,
      refreshExpiresIn: 1209600,
    },
  })
  tokens?: AuthTokensDto;

  @ApiPropertyOptional({
    type: UserResponseDto,
  })
  user?: UserResponseDto;

  @ApiPropertyOptional({
    description:
      'Indicates whether email verification is required before login is allowed.',
    example: false,
  })
  requiresEmailVerification?: boolean;
}
