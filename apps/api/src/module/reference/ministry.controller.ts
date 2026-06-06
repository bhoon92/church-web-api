import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { MinistryEntity } from '@src/database/entities/ministry.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('ministries')
@UseGuards(JwtAuthGuard)
export class MinistryController {
  constructor(private readonly refs: ReferenceService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.refs.list(MinistryEntity, auth.churchId);
  }

  @Post()
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: UpsertReferenceDto) {
    return this.refs.create(MinistryEntity, auth.churchId, dto);
  }

  @Patch(':id')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertReferenceDto
  ) {
    return this.refs.update(MinistryEntity, auth.churchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.refs.remove(MinistryEntity, auth.churchId, id);
  }
}
