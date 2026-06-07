import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';
import { FiscalYearService } from './fiscal-year.service';

@Controller('finance/fiscal-years')
@UseGuards(JwtAuthGuard)
export class FiscalYearController {
  constructor(private readonly fiscalYears: FiscalYearService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.fiscalYears.list(auth.churchId);
  }

  @Post()
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateFiscalYearDto) {
    return this.fiscalYears.create(auth.churchId, dto);
  }

  @Post(':id/current')
  setCurrent(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.fiscalYears.setCurrent(auth.churchId, id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.fiscalYears.remove(auth.churchId, id);
  }
}
