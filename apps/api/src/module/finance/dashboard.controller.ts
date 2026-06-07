import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { DashboardService } from './dashboard.service';

@Controller('finance/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.dashboard.summary(auth.churchId);
  }
}
