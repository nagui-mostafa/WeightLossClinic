import { Module } from '@nestjs/common';
import { CommonModule } from '../common';
import { RecordsController } from './controllers/records.controller';
import { RecordsService } from './services/records.service';

@Module({
  imports: [CommonModule],
  controllers: [RecordsController],
  providers: [RecordsService],
  exports: [RecordsService],
})
export class RecordsModule {}
