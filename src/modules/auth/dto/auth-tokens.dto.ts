import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ description: 'Access token expiration time in seconds' })
  expiresIn!: number;

  @ApiProperty({
    description: 'Refresh token expiration time in seconds',
  })
  refreshExpiresIn!: number;
}

export class AuthResponseDto {
  @ApiPropertyOptional({ type: AuthTokensDto })
  tokens?: AuthTokensDto;

  @ApiPropertyOptional({ type: UserResponseDto })
  user?: UserResponseDto;

  @ApiPropertyOptional({
    description:
      'Indicates whether email verification is required before login is allowed.',
  })
  requiresEmailVerification?: boolean;
}
