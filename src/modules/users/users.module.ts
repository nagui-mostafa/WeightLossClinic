import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PatientStatusScheduler } from './services/patient-status.scheduler';

@Module({
  imports: [CommonModule],
  controllers: [UsersController],
  providers: [UsersService, PatientStatusScheduler],
  exports: [UsersService, PatientStatusScheduler],
})
export class UsersModule {}
