import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PositionEntity } from '@src/database/entities/position.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('positions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PositionController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.referenceService.list(PositionEntity, auth.churchId);
  }

  @Post()
  @Permissions('settings:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: UpsertReferenceDto) {
    return this.referenceService.create(PositionEntity, auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('settings:write')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertReferenceDto
  ) {
    return this.referenceService.update(PositionEntity, auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('settings:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.referenceService.remove(PositionEntity, auth.churchId, id);
  }
}
