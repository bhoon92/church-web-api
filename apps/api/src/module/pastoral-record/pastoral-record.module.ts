import { Module } from '@nestjs/common';
import { AuthModule } from '@src/module/auth/auth.module';
import { PastoralRecordController } from './pastoral-record.controller';
import { PastoralRecordService } from './pastoral-record.service';

@Module({
  imports: [AuthModule],
  controllers: [PastoralRecordController],
  providers: [PastoralRecordService],
  exports: [PastoralRecordService],
})
export class PastoralRecordModule {}
