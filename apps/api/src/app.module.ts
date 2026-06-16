import { join } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
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
import { GoogleCalendarModule } from './module/google-calendar/google-calendar.module';
import { HomeModule } from './module/home/home.module';
import { MemberModule } from './module/member/member.module';
import { OrganizationChartModule } from './module/organization-chart/organization-chart.module';
import { PastoralRecordModule } from './module/pastoral-record/pastoral-record.module';
import { MemberPositionModule } from './module/position/member-position.module';
import { ReferenceModule } from './module/reference/reference.module';
import { TeamModule } from './module/team/team.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // production: apps/web/dist 정적 파일 서빙 (SPA 폴백 포함). /api* 는 제외.
    ...(isProduction
      ? [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', '..', '..', '..', 'apps', 'web', 'dist'),
            exclude: ['/api*'],
          }),
        ]
      : []),
    AuthModule,
    ChurchModule,
    MemberModule,
    ReferenceModule,
    AffiliationModule,
    OrganizationChartModule,
    MemberPositionModule,
    PastoralRecordModule,
    AttendanceModule,
    FinanceModule,
    ExportModule,
    GalleryModule,
    CalendarModule,
    GoogleCalendarModule,
    TeamModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
