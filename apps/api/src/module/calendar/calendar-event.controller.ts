import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CalendarEventService } from './calendar-event.service';
import { CreateCalendarEventDto, ListEventQueryDto, UpdateCalendarEventDto } from './dto/calendar-event.dto';

@Controller('calendar/events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CalendarEventController {
  constructor(private readonly events: CalendarEventService) {}

  @Get()
  @Permissions('calendar:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: ListEventQueryDto) {
    return this.events.list(auth.churchId, query.from, query.to);
  }

  @Post()
  @Permissions('calendar:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateCalendarEventDto) {
    return this.events.create(auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('calendar:write')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarEventDto
  ) {
    return this.events.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('calendar:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.events.remove(auth.churchId, id);
  }
}
