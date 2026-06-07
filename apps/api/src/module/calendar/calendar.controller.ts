import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CalendarService } from './calendar.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto/calendar.dto';

@Controller('calendar/calendars')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendars: CalendarService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.calendars.list(auth.churchId);
  }

  @Post()
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateCalendarDto) {
    return this.calendars.create(auth.churchId, dto);
  }

  @Patch(':id')
  update(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCalendarDto) {
    return this.calendars.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.calendars.remove(auth.churchId, id);
  }
}
