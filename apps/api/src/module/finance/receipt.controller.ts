import { Controller, Get, Param, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { ReceiptService } from './receipt.service';

@Controller('finance/offerings/receipt')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceiptController {
  constructor(private readonly receipts: ReceiptService) {}

  /** 연말정산 기부금영수증 PDF 다운로드. */
  @Get(':memberId/:year')
  @Permissions('finance:read')
  async download(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('year', ParseIntPipe) year: number,
    @Res() res: Response
  ) {
    const { buffer, filename } = await this.receipts.generate(auth.churchId, memberId, year);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  }
}
