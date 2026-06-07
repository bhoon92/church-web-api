import { Module } from '@nestjs/common';
import { AuthModule } from '@src/module/auth/auth.module';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { FiscalYearController } from './fiscal-year.controller';
import { FiscalYearService } from './fiscal-year.service';
import { OfferingController } from './offering.controller';
import { OfferingService } from './offering.service';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [AuthModule],
  controllers: [FiscalYearController, OfferingController, TransactionController, BudgetController, DashboardController],
  providers: [FiscalYearService, OfferingService, TransactionService, BudgetService, DashboardService],
  exports: [FiscalYearService, OfferingService, TransactionService, BudgetService],
})
export class FinanceModule {}
