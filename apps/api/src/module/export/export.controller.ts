import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { ExportService } from './export.service';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('export')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExportController {
  constructor(private readonly exports: ExportService) {}

  @Get('offerings/:year')
  @Permissions('finance:read')
  async offerings(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('year', ParseIntPipe) year: number,
    @Res() res: Response
  ) {
    this.send(res, await this.exports.offerings_xlsx(auth.churchId, year), `offerings-${year}.xlsx`);
  }

  @Get('transactions')
  @Permissions('finance:read')
  async transactions(@RequireChurch() auth: AuthContext & { churchId: number }, @Res() res: Response) {
    this.send(res, await this.exports.transactions_xlsx(auth.churchId), 'transactions.xlsx');
  }

  @Get('budgets')
  @Permissions('finance:read')
  async budgets(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Res() res: Response,
    @Query('fiscalYearId') fiscalYearId?: string
  ) {
    const buffer = await this.exports.budgets_xlsx(auth.churchId, fiscalYearId ? Number(fiscalYearId) : undefined);
    this.send(res, buffer, 'budgets.xlsx');
  }

  @Get('members')
  @Permissions('member:read')
  async members(@RequireChurch() auth: AuthContext & { churchId: number }, @Res() res: Response) {
    this.send(res, await this.exports.members_xlsx(auth.churchId), 'members.xlsx');
  }

  private send(res: Response, buffer: Buffer, filename: string) {
    res.setHeader('Content-Type', XLSX_MIME);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  }
}
