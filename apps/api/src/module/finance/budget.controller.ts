import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { BudgetService } from './budget.service';

@Controller('finance/budgets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BudgetController {
  constructor(private readonly budgets: BudgetService) {}

  @Get()
  @Permissions('finance:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query('fiscalYearId') fiscalYearId?: string) {
    return this.budgets.list(auth.churchId, fiscalYearId ? Number(fiscalYearId) : undefined);
  }

  @Post()
  @Permissions('finance:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateBudgetDto) {
    return this.budgets.create(auth.churchId, dto);
  }

  @Delete(':id')
  @Permissions('finance:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.budgets.remove(auth.churchId, id);
  }
}
