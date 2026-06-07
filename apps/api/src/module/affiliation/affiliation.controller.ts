import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { AffiliationService } from './affiliation.service';
import { AssignAffiliationDto } from './dto/assign.dto';
import { SetLeaderDto } from './dto/set-leader.dto';

type Auth = AuthContext & { churchId: number };

@Controller('members/:memberId')
@UseGuards(JwtAuthGuard)
export class AffiliationController {
  constructor(private readonly aff: AffiliationService) {}

  @Post('departments')
  assignDepartment(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: AssignAffiliationDto) {
    return this.aff.assign('department', auth.churchId, memberId, dto);
  }

  @Delete('departments/:refId')
  @HttpCode(204)
  endDepartment(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('refId', ParseIntPipe) refId: number
  ) {
    return this.aff.end('department', auth.churchId, memberId, refId);
  }

  @Patch('departments/:refId/leader')
  leaderDepartment(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('refId', ParseIntPipe) refId: number,
    @Body() dto: SetLeaderDto
  ) {
    return this.aff.setLeader('department', auth.churchId, memberId, refId, dto.isLeader, dto.roleLabel);
  }

  @Post('ministries')
  assignMinistry(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: AssignAffiliationDto) {
    return this.aff.assign('ministry', auth.churchId, memberId, dto);
  }

  @Patch('ministries/:refId/leader')
  leaderMinistry(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('refId', ParseIntPipe) refId: number,
    @Body() dto: SetLeaderDto
  ) {
    return this.aff.setLeader('ministry', auth.churchId, memberId, refId, dto.isLeader, dto.roleLabel);
  }

  @Delete('ministries/:refId')
  @HttpCode(204)
  endMinistry(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Param('refId', ParseIntPipe) refId: number) {
    return this.aff.end('ministry', auth.churchId, memberId, refId);
  }

  @Post('small-groups')
  assignSmallGroup(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: AssignAffiliationDto) {
    return this.aff.assign('smallGroup', auth.churchId, memberId, dto);
  }

  @Patch('small-groups/:refId/leader')
  leaderSmallGroup(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('refId', ParseIntPipe) refId: number,
    @Body() dto: SetLeaderDto
  ) {
    return this.aff.setLeader('smallGroup', auth.churchId, memberId, refId, dto.isLeader, dto.roleLabel);
  }

  @Delete('small-groups/:refId')
  @HttpCode(204)
  endSmallGroup(
    @RequireChurch() auth: Auth,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Param('refId', ParseIntPipe) refId: number
  ) {
    return this.aff.end('smallGroup', auth.churchId, memberId, refId);
  }
}
