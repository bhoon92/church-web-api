import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AffiliationModule } from './module/affiliation/affiliation.module';
import { AttendanceModule } from './module/attendance/attendance.module';
import { AuthModule } from './module/auth/auth.module';
import { CalendarModule } from './module/calendar/calendar.module';
import { ChurchModule } from './module/church/church.module';
import { ExportModule } from './module/export/export.module';
import { FinanceModule } from './module/finance/finance.module';
import { GalleryModule } from './module/gallery/gallery.module';
import { MemberModule } from './module/member/member.module';
import { PastoralRecordModule } from './module/pastoral-record/pastoral-record.module';
import { MemberPositionModule } from './module/position/member-position.module';
import { ReferenceModule } from './module/reference/reference.module';

@Module({
  imports: [
    AuthModule,
    ChurchModule,
    MemberModule,
    ReferenceModule,
    AffiliationModule,
    MemberPositionModule,
    PastoralRecordModule,
    AttendanceModule,
    FinanceModule,
    ExportModule,
    GalleryModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
