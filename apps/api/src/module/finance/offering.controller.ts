import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateOfferingDto } from './dto/create-offering.dto';
import { UpdateOfferingDto } from './dto/update-offering.dto';
import { ListOfferingQueryDto } from './dto/list-offering.dto';
import { OfferingService } from './offering.service';

@Controller('finance/offerings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OfferingController {
  constructor(private readonly offerings: OfferingService) {}

  @Get()
  @Permissions('finance:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: ListOfferingQueryDto) {
    return this.offerings.list(auth.churchId, query);
  }

  @Post()
  @Permissions('finance:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateOfferingDto) {
    return this.offerings.create(auth.churchId, auth.accountId, dto);
  }

  @Patch(':id')
  @Permissions('finance:write')
  update(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOfferingDto) {
    return this.offerings.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('finance:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.offerings.remove(auth.churchId, id);
  }

  /** 연말정산 영수증용 — member 별 calendar-year 합계. */
  @Get('summary/:memberId/:year')
  @Permissions('finance:read')
  summary(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('year', ParseIntPipe) year: number
  ) {
    return this.offerings.memberAnnualSummary(auth.churchId, memberId, year);
  }
}
