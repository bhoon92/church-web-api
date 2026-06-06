import { Module } from '@nestjs/common';
import { AffiliationModule } from '@src/module/affiliation/affiliation.module';
import { AuthModule } from '@src/module/auth/auth.module';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';

@Module({
  imports: [AuthModule, AffiliationModule],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
