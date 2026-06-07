import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CalendarSubscriptionEntity } from '@src/database/entities/calendar-subscription.entity';
import { UpdateSubscriptionDto } from './dto/subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller('calendar/subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get()
  async mine(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.toResponse(await this.subscriptions.getOrCreate(auth.churchId, auth.accountId));
  }

  @Put()
  async update(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: UpdateSubscriptionDto) {
    return this.toResponse(await this.subscriptions.update(auth.churchId, auth.accountId, dto.calendarIds));
  }

  @Post('regenerate')
  async regenerate(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.toResponse(await this.subscriptions.regenerate(auth.churchId, auth.accountId));
  }

  private toResponse(sub: CalendarSubscriptionEntity) {
    return {
      feedToken: sub.feedToken,
      calendarIds: sub.calendarIds,
      feedPath: `/api/calendar/feed/${sub.feedToken}.ics`,
    };
  }
}
