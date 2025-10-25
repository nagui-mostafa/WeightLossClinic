import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';

@Module({
  imports: [CommonModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
