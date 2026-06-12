import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { AffiliationService } from './affiliation.service';
import { AssignAffiliationDto } from './dto/assign.dto';
import { SetLeaderDto } from './dto/set-leader.dto';

type Auth = AuthContext & { churchId: number };

@Controller('members/:memberId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AffiliationController {
  constructor(private readonly affiliationService: AffiliationService) {}

  @Post('departments')
  @Permissions('member:write')
  assignDepartment(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: AssignAffiliationDto) {
    return this.affiliationService.assign('department', auth.churchId, memberId, dto);
  }

  @Delete('departments/:referenceId')
  @Permissions('member:write')
  @HttpCode(204)
  endDepartment(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('referenceId', ParseIntPipe) referenceId: number
  ) {
    return this.affiliationService.end('department', auth.churchId, memberId, referenceId);
  }

  @Patch('departments/:referenceId/leader')
  @Permissions('member:write')
  leaderDepartment(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('referenceId', ParseIntPipe) referenceId: number,
    @Body() dto: SetLeaderDto
  ) {
    return this.affiliationService.setLeader('department', auth.churchId, memberId, referenceId, dto.isLeader, dto.roleLabel);
  }

  @Post('ministries')
  @Permissions('member:write')
  assignMinistry(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: AssignAffiliationDto) {
    return this.affiliationService.assign('ministry', auth.churchId, memberId, dto);
  }

  @Patch('ministries/:referenceId/leader')
  @Permissions('member:write')
  leaderMinistry(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('referenceId', ParseIntPipe) referenceId: number,
    @Body() dto: SetLeaderDto
  ) {
    return this.affiliationService.setLeader('ministry', auth.churchId, memberId, referenceId, dto.isLeader, dto.roleLabel);
  }

  @Delete('ministries/:referenceId')
  @Permissions('member:write')
  @HttpCode(204)
  endMinistry(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('referenceId', ParseIntPipe) referenceId: number
  ) {
    return this.affiliationService.end('ministry', auth.churchId, memberId, referenceId);
  }

  @Post('small-groups')
  @Permissions('member:write')
  assignSmallGroup(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: AssignAffiliationDto) {
    return this.affiliationService.assign('smallGroup', auth.churchId, memberId, dto);
  }

  @Patch('small-groups/:referenceId/leader')
  @Permissions('member:write')
  leaderSmallGroup(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('referenceId', ParseIntPipe) referenceId: number,
    @Body() dto: SetLeaderDto
  ) {
    return this.affiliationService.setLeader('smallGroup', auth.churchId, memberId, referenceId, dto.isLeader, dto.roleLabel);
  }

  @Delete('small-groups/:referenceId')
  @Permissions('member:write')
  @HttpCode(204)
  endSmallGroup(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('referenceId', ParseIntPipe) referenceId: number
  ) {
    return this.affiliationService.end('smallGroup', auth.churchId, memberId, referenceId);
  }
}
