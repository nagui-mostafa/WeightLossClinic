import { Role } from '../../common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

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
    description: 'E.164 formatted phone number',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'phone must be a valid E.164 number',
  })
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

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(200)
  weightLoss?: number;

  @ApiPropertyOptional({ example: 1.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  weightDose?: number;

  @ApiPropertyOptional({ example: 95.2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(20)
  @Max(400)
  currentWeight?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(20)
  @Max(400)
  goalWeight?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isActive?: boolean = true;
}
