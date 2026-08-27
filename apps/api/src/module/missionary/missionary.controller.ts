import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiConflictResponse, ApiNoContentResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@src/common/swagger/api-auth.decorator';
import { SwaggerTag } from '@src/common/swagger/swagger-tags';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { ChangeStageDto, CreateMissionaryDto, ListMissionaryQueryDto, UpdateMissionaryDto } from './dto/missionary.dto';
import { MissionaryService } from './missionary.service';

type Auth = AuthContext & { churchId: number };

@ApiTags(SwaggerTag.MISSIONARY)
@ApiAuth()
@Controller('missionaries')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MissionaryController {
  constructor(private readonly missionaries: MissionaryService) {}

  @Get()
  @Permissions('missionary:read')
  @ApiOperation({
    summary: '선교사 목록',
    description: [
      '교인 이름·소속 사역팀 이름이 붙은 파송 트랙 목록.',
      '',
      '- `stage`: 특정 단계만',
      '- `scope=active`: 파송확정·현지·안식년만 (대시보드 "현재 파송 인원"과 같은 기준)',
    ].join('\n'),
  })
  list(@RequireChurch() auth: Auth, @Query() query: ListMissionaryQueryDto) {
    return this.missionaries.list(auth.churchId, query);
  }

  @Get('summary')
  @Permissions('missionary:read')
  @ApiOperation({
    summary: '파송 현황 요약',
    description: '`{ active, byStage, commissionedThisYear }`. 이 교회의 핵심 지표라 홈 대시보드에서도 같은 값을 쓴다.',
  })
  summary(@RequireChurch() auth: Auth) {
    return this.missionaries.summary(auth.churchId);
  }

  @Get('by-member/:memberId')
  @Permissions('missionary:read')
  @ApiOperation({
    summary: '교인의 파송 프로필 조회',
    description: '교인 상세 화면용. 파송 트랙에 없는 교인이면 `null` 을 반환한다(404 아님).',
  })
  @ApiParam({ name: 'memberId', description: '교인 id', type: Number })
  byMember(@RequireChurch() auth: Auth, @Param('memberId', ParseIntPipe) memberId: number) {
    return this.missionaries.findByMember(auth.churchId, memberId);
  }

  @Get(':id')
  @Permissions('missionary:read')
  @ApiOperation({ summary: '선교사 상세 (단계 이력 포함)', description: '프로필 + 단계 전이 이력(`history`) 최신순.' })
  detail(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number) {
    return this.missionaries.detail(auth.churchId, id);
  }

  @Post()
  @Permissions('missionary:write')
  @ApiOperation({
    summary: '파송 트랙 등록',
    description: [
      '교인을 파송 트랙에 올린다. **교인 1명당 프로필 1개**라 이미 등록된 교인이면 409.',
      '',
      '`stage` 생략 시 후보(candidate)로 시작하며, 최초 단계도 이력에 기록된다.',
    ].join('\n'),
  })
  @ApiConflictResponse({ description: '이미 파송 트랙에 등록된 교인' })
  create(@RequireChurch() auth: Auth, @Body() dto: CreateMissionaryDto) {
    return this.missionaries.create(auth.churchId, auth.accountId, dto);
  }

  @Patch(':id')
  @Permissions('missionary:write')
  @ApiOperation({
    summary: '선교사 정보 수정',
    description:
      '파송지·사역 내용·비고 등을 수정한다. **단계(`stage`)는 여기서 바뀌지 않는다** — 이력이 남아야 하므로 전용 엔드포인트 사용.',
  })
  update(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMissionaryDto) {
    return this.missionaries.update(auth.churchId, id, dto);
  }

  @Post(':id/stage')
  @Permissions('missionary:write')
  @ApiOperation({
    summary: '단계 전이',
    description: [
      '후보 → 훈련 → 파송확정 → 현지 → 안식년 → 복귀/종료 사이를 이동하며 **전이 이력을 남긴다**.',
      '',
      '연동되는 것들:',
      '- 파송확정/현지 진입 시 `commissionedAt` / `departedAt` 이 비어 있으면 전이일로 채워진다.',
      '- 복귀·종료 시 `endedAt` 기록.',
      '- **교인의 재적상태도 함께 바뀐다** — 파송 중이면 "파송"(출석 명단 제외), 복귀하면 "사역자".',
      '',
      '같은 단계로 다시 보내면 아무 일도 일어나지 않는다(이력 중복 방지).',
    ].join('\n'),
  })
  changeStage(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number, @Body() dto: ChangeStageDto) {
    return this.missionaries.changeStage(auth.churchId, id, auth.accountId, dto);
  }

  @Delete(':id')
  @Permissions('missionary:write')
  @HttpCode(204)
  @ApiOperation({
    summary: '파송 트랙에서 제거',
    description: '잘못 등록한 경우에만. 사역이 끝난 것이라면 삭제 대신 단계를 `ended` 로 두는 편이 이력이 남아 낫다.',
  })
  @ApiNoContentResponse({ description: '삭제 완료' })
  remove(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number) {
    return this.missionaries.remove(auth.churchId, id);
  }
}
