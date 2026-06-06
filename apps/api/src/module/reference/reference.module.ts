import { Module } from '@nestjs/common';
import { AuthModule } from '@src/module/auth/auth.module';
import { DepartmentController } from './department.controller';
import { MinistryController } from './ministry.controller';
import { ReferenceService } from './reference.service';
import { SmallGroupController } from './small-group.controller';

@Module({
  imports: [AuthModule],
  controllers: [DepartmentController, MinistryController, SmallGroupController],
  providers: [ReferenceService],
  exports: [ReferenceService],
})
export class ReferenceModule {}
