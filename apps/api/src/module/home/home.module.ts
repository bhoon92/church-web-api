import { Module } from '@nestjs/common';
import { CalendarModule } from '@src/module/calendar/calendar.module';
import { FinanceModule } from '@src/module/finance/finance.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [FinanceModule, CalendarModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
