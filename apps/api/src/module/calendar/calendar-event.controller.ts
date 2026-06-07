import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CalendarEventService } from './calendar-event.service';
import { CreateCalendarEventDto, ListEventQueryDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';

@Controller('calendar/events')
@UseGuards(JwtAuthGuard)
export class CalendarEventController {
  constructor(private readonly events: CalendarEventService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: ListEventQueryDto) {
    return this.events.list(auth.churchId, query.from, query.to);
  }

  @Post()
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateCalendarEventDto) {
    return this.events.create(auth.churchId, dto);
  }

  @Patch(':id')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarEventDto
  ) {
    return this.events.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.events.remove(auth.churchId, id);
  }
}
