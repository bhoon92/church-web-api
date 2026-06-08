import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMemberQueryDto } from './dto/list-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberService } from './member.service';

@Controller('members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MemberController {
  constructor(private readonly members: MemberService) {}

  @Get()
  @Permissions('member:read')
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: ListMemberQueryDto) {
    return this.members.list(auth.churchId, query);
  }

  @Get(':id')
  @Permissions('member:read')
  detail(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.members.findById(auth.churchId, id);
  }

  @Post()
  @Permissions('member:write')
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateMemberDto) {
    return this.members.create(auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('member:write')
  update(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
    return this.members.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissions('member:write')
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.members.remove(auth.churchId, id);
  }
}
