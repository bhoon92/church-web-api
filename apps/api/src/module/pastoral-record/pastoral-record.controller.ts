import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreatePastoralRecordDto } from './dto/create-pastoral-record.dto';
import { UpdatePastoralRecordDto } from './dto/update-pastoral-record.dto';
import { PastoralRecordService } from './pastoral-record.service';

@Controller('members/:memberId/pastoral-records')
@UseGuards(JwtAuthGuard)
export class PastoralRecordController {
  constructor(private readonly records: PastoralRecordService) {}

  @Get()
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('memberId', ParseIntPipe) memberId: number) {
    return this.records.listForMember(auth.churchId, memberId);
  }

  @Post()
  create(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: CreatePastoralRecordDto
  ) {
    return this.records.create(auth.churchId, memberId, auth.accountId, dto);
  }

  @Patch(':id')
  update(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePastoralRecordDto
  ) {
    return this.records.update(auth.churchId, memberId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.records.remove(auth.churchId, memberId, id);
  }
}
