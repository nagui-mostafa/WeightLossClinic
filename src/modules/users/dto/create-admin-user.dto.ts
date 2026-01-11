import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class CreateAdminUserDto extends OmitType(CreateUserDto, [
  'password',
] as const) {}
