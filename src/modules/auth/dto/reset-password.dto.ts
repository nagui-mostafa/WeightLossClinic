import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 1, example: '123' })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  newPassword!: string;
}
