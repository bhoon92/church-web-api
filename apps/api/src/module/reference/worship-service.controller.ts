import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { WorshipServiceEntity } from '@src/database/entities/worship-service.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('worship-services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorshipServiceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.referenceService.list(WorshipServiceEntity, auth.churchId);
  }

  @Post()
  @Permissions('settings:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: UpsertReferenceDto) {
    return this.referenceService.create(WorshipServiceEntity, auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('settings:write')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertReferenceDto
  ) {
    return this.referenceService.update(WorshipServiceEntity, auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('settings:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.referenceService.remove(WorshipServiceEntity, auth.churchId, id);
  }
}
