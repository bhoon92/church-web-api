import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { InviteMemberDto, UpdateRoleDto } from './dto/team.dto';
import { TeamService } from './team.service';

@Controller('team')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeamController {
  constructor(private readonly team: TeamService) {}

  @Get()
  @Permissions('team:manage')
  list(@RequireChurch() auth: AuthContext & { churchId: number }) {
    return this.team.list(auth.churchId);
  }

  @Post('invite')
  @Permissions('team:manage')
  invite(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: InviteMemberDto) {
    return this.team.invite(auth.churchId, dto.email, dto.role);
  }

  @Patch(':membershipId')
  @Permissions('team:manage')
  updateRole(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('membershipId', ParseIntPipe) membershipId: number,
    @Body() dto: UpdateRoleDto
  ) {
    return this.team.updateRole(auth.churchId, membershipId, dto.role);
  }

  @Delete(':membershipId')
  @HttpCode(204)
  @Permissions('team:manage')
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('membershipId', ParseIntPipe) membershipId: number) {
    return this.team.remove(auth.churchId, membershipId);
  }
}
