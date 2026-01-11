import { Module } from '@nestjs/common';
import { ConfigModule } from '../config';
import { CommonModule } from '../common';
import { GrouponController } from './groupon.controller';
import { GrouponService } from './groupon.service';
import { GrouponSignatureService } from './groupon-signature.service';
import { GrouponReconciliationService } from './reconciliation.service';

@Module({
  imports: [ConfigModule, CommonModule],
  controllers: [GrouponController],
  providers: [
    GrouponService,
    GrouponSignatureService,
    GrouponReconciliationService,
  ],
  exports: [GrouponService],
})
export class GrouponModule {}
