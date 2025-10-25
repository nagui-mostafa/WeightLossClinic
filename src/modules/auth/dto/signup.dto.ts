import { PickType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';

export class SignupDto extends PickType(CreateUserDto, [
  'firstName',
  'lastName',
  'email',
  'phone',
  'password',
  'weightLoss',
  'weightDose',
  'currentWeight',
  'goalWeight',
] as const) {}
