import { Body, Controller, Delete, HttpCode, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { PromotePositionDto } from './dto/promote.dto';
import { MemberPositionService } from './member-position.service';

@Controller('members/:memberId/position')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MemberPositionController {
  constructor(private readonly positions: MemberPositionService) {}

  /** 직분 부여/승직 — 현재 직분은 자동 종료, 새 row 생성 (트랜잭션). */
  @Post()
  @Permissions('member:write')
  promote(
    @RequireChurch() auth: AuthContext & { churchId: number },
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body() dto: PromotePositionDto
  ) {
    return this.positions.promote(auth.churchId, memberId, dto);
  }

  /** 현재 직분 종료 (다음 부여 없이 비워두기). */
  @Delete()
  @Permissions('member:write')
  @HttpCode(204)
  endCurrent(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('memberId', ParseIntPipe) memberId: number) {
    return this.positions.endCurrent(auth.churchId, memberId);
  }
}
