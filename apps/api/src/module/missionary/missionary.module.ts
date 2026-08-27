import { Module } from '@nestjs/common';
import { AuthModule } from '@src/module/auth/auth.module';
import { MissionaryController } from './missionary.controller';
import { MissionaryService } from './missionary.service';
import { MissionaryStageService } from './stage.service';

@Module({
  imports: [AuthModule],
  controllers: [MissionaryController],
  providers: [MissionaryService, MissionaryStageService],
  exports: [MissionaryService, MissionaryStageService],
})
export class MissionaryModule {}
