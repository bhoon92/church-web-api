import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { OrganizationChartService } from './organization-chart.service';

type Auth = AuthContext & { churchId: number };

@Controller('organization-chart')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationChartController {
  constructor(private readonly orgChart: OrganizationChartService) {}

  @Get()
  @Permissions('member:read')
  tree(@RequireChurch() auth: Auth, @Query('year') year?: string) {
    return this.orgChart.tree(auth.churchId, year ? Number(year) : new Date().getFullYear());
  }
}
