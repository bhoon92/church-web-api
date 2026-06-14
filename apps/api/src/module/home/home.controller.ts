import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { HomeService } from './home.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get()
  summary(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.home.summary(auth.churchId);
  }
}
