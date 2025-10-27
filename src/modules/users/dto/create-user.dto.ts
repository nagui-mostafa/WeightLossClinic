import { Role } from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    example: '+14155552671',
    description: 'Phone number (format not enforced)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    minLength: 1,
    description: 'Any password is accepted; choose something memorable to you.',
    example: '123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.PATIENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role = Role.PATIENT;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isActive?: boolean = true;
}
