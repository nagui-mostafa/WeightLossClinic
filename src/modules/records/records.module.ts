import { Module } from '@nestjs/common';
import { CommonModule } from '../common';
import { UsersModule } from '../users/users.module';
import { GrouponModule } from '../groupon/groupon.module';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';
import { FedexTrackingService } from './services/fedex-tracking.service';

@Module({
  imports: [CommonModule, UsersModule, GrouponModule],
  controllers: [RecordsController],
  providers: [RecordsService, FedexTrackingService],
  exports: [RecordsService],
})
export class RecordsModule {}
