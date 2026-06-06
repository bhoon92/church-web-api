import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { DepartmentEntity } from '@src/database/entities/department.entity';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { UpsertReferenceDto } from './dto/upsert-reference.dto';
import { ReferenceService } from './reference.service';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly refs: ReferenceService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.refs.list(DepartmentEntity, auth.churchId);
  }

  @Post()
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: UpsertReferenceDto) {
    return this.refs.create(DepartmentEntity, auth.churchId, dto);
  }

  @Patch(':id')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertReferenceDto
  ) {
    return this.refs.update(DepartmentEntity, auth.churchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.refs.remove(DepartmentEntity, auth.churchId, id);
  }
}
