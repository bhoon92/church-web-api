import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionService } from './transaction.service';

@Controller('finance/transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TransactionController {
  constructor(private readonly transactions: TransactionService) {}

  @Get()
  @Permissions('finance:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.transactions.list(auth.churchId, 100);
  }

  @Post()
  @Permissions('finance:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(auth.churchId, auth.accountId, dto);
  }

  @Delete(':id')
  @Permissions('finance:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.transactions.remove(auth.churchId, id);
  }
}
