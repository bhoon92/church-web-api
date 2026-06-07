import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { ListOfferingQueryDto } from './dto/list-offering.dto';
import { OfferingService } from './offering.service';

@Controller('finance/offerings')
@UseGuards(JwtAuthGuard)
export class OfferingController {
  constructor(private readonly offerings: OfferingService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: ListOfferingQueryDto) {
    return this.offerings.list(auth.churchId, query);
  }

  @Post()
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateOfferingDto) {
    return this.offerings.create(auth.churchId, auth.accountId, dto);
  }

  /** 연말정산 영수증용 — member 별 calendar-year 합계. */
  @Get('summary/:memberId/:year')
  summary(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('year', ParseIntPipe) year: number
  ) {
    return this.offerings.memberAnnualSummary(auth.churchId, memberId, year);
  }
}
