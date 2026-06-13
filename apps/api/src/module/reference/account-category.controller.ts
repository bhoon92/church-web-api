import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AccountCategoryEntity } from '@src/database/entities/account-category.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';
import { UpdateReferenceDto } from './dto/update-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('account-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccountCategoryController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.referenceService.list(AccountCategoryEntity, auth.churchId);
  }

  @Post()
  @Permissions('settings:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: UpsertReferenceDto) {
    return this.referenceService.create(AccountCategoryEntity, auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('settings:write')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReferenceDto
  ) {
    return this.referenceService.update(AccountCategoryEntity, auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('settings:write')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.referenceService.remove(AccountCategoryEntity, auth.churchId, id);
  }
}
