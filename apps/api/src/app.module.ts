import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './module/auth/auth.module';
import { ChurchModule } from './module/church/church.module';
import { MemberModule } from './module/member/member.module';

@Module({
  imports: [AuthModule, ChurchModule, MemberModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
