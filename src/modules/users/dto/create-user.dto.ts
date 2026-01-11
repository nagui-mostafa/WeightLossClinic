import { Role } from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateUserRecordDto, UpdateUserSnapshotDto } from './update-user.dto';

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
    example: '+1 (555) 010-2000',
    description: 'Phone number (format not enforced)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description:
      'Any password is accepted; use a secure value in production environments.',
    example: '12345678',
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

  @ApiPropertyOptional({
    type: UpdateUserSnapshotDto,
    nullable: true,
    description: 'Initial snapshot payload to associate with the user',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserSnapshotDto)
  snapshot?: UpdateUserSnapshotDto | null;

  @ApiPropertyOptional({
    type: [UpdateUserRecordDto],
    description: 'Records to seed for the user upon creation',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserRecordDto)
  records?: UpdateUserRecordDto[];
}
