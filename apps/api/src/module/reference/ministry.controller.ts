import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MinistryEntity } from '@src/database/entities/ministry.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('ministries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MinistryController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query('year', ParseIntPipe) year: number) {
    return this.referenceService.list(MinistryEntity, auth.churchId, year);
  }

  @Post()
  @Permissions('settings:write')
  create(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Query('year', ParseIntPipe) year: number,
    @Body() dto: UpsertReferenceDto
  ) {
    return this.referenceService.create(MinistryEntity, auth.churchId, dto, year);
  }

  @Post('copy')
  @Permissions('settings:write')
  copy(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Query('from', ParseIntPipe) fromYear: number,
    @Query('to', ParseIntPipe) toYear: number
  ) {
    return this.referenceService.copyYear(MinistryEntity, auth.churchId, fromYear, toYear);
  }

  @Patch(':id')
  @Permissions('settings:write')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReferenceDto
  ) {
    return this.referenceService.update(MinistryEntity, auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('settings:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.referenceService.remove(MinistryEntity, auth.churchId, id);
  }
}
