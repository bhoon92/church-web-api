import { Module } from '@nestjs/common';
import { AuthModule } from '@src/module/auth/auth.module';
import { MissionaryController } from './missionary.controller';
import { MissionaryService } from './missionary.service';

@Module({
  imports: [AuthModule],
  controllers: [MissionaryController],
  providers: [MissionaryService],
  exports: [MissionaryService],
})
export class MissionaryModule {}
