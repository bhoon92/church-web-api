import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AffiliationModule } from './module/affiliation/affiliation.module';
import { AuthModule } from './module/auth/auth.module';
import { ChurchModule } from './module/church/church.module';
import { MemberModule } from './module/member/member.module';
import { MemberPositionModule } from './module/position/member-position.module';
import { ReferenceModule } from './module/reference/reference.module';

@Module({
  imports: [AuthModule, ChurchModule, MemberModule, ReferenceModule, AffiliationModule, MemberPositionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
