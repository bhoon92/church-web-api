import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventService } from './event.service';

@Controller('events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventController {
  constructor(private readonly events: EventService) {}

  @Get()
  @Permissions('gallery:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.events.list(auth.churchId);
  }

  @Post()
  @Permissions('gallery:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateEventDto) {
    return this.events.create(auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('gallery:write')
  update(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEventDto) {
    return this.events.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('gallery:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.events.remove(auth.churchId, id);
  }
}
