import { Module } from '@nestjs/common';
import { AffiliationModule } from '@src/module/affiliation/affiliation.module';
import { AuthModule } from '@src/module/auth/auth.module';
import { MemberPositionModule } from '@src/module/position/member-position.module';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberStatusController } from './member-status.controller';
import { MemberStatusService } from './member-status.service';

@Module({
  imports: [AuthModule, AffiliationModule, MemberPositionModule],
  controllers: [MemberController, MemberStatusController],
  providers: [MemberService, MemberStatusService],
  exports: [MemberService],
})
export class MemberModule {}
