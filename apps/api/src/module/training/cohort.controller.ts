import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@src/common/swagger/api-auth.decorator';
import { SwaggerTag } from '@src/common/swagger/swagger-tags';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { TrainingCohortService } from './cohort.service';
import {
  CreateCohortDto,
  EnrollMembersDto,
  ListCohortQueryDto,
  MarkTrainingAttendanceDto,
  UpdateCohortDto,
  UpdateSessionDto,
} from './dto/cohort.dto';
import { TrainingEnrollmentService } from './enrollment.service';

type Auth = AuthContext & { churchId: number };

@ApiTags(SwaggerTag.TRAINING)
@ApiAuth()
@Controller('training/cohorts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TrainingCohortController {
  constructor(
    private readonly cohorts: TrainingCohortService,
    private readonly enrollments: TrainingEnrollmentService
  ) {}

  @Get()
  @Permissions('training:read')
  @ApiOperation({
    summary: '기수 목록',
    description: [
      '최근 시작순. 각 기수에 과정 이름·담당자 이름과 함께 **회차 수 / 수강 인원 / 수료 인원**이 붙는다.',
      '',
      '`courseId`·`status`(planned/ongoing/closed) 로 필터 가능.',
    ].join('\n'),
  })
  list(@RequireChurch() auth: Auth, @Query() query: ListCohortQueryDto) {
    return this.cohorts.list(auth.churchId, query);
  }

  @Post()
  @Permissions('training:write')
  @ApiOperation({
    summary: '기수 개설',
    description: [
      '기수를 만들면서 **회차를 함께 생성한다**(한 트랜잭션). 회차 없이 만들면 출석 체크를 할 수 없기 때문.',
      '',
      '- `ordinal` 생략 시 해당 과정의 마지막 기수 + 1 이 자동 부여된다.',
      '- `sessionCount` 생략 시 과정의 `defaultSessionCount` 를 따른다 (믿음학교 12 등).',
      '- 회차의 날짜·주제는 비워둔 채 생성되며 `PATCH /training/cohorts/sessions/{sessionId}` 로 채운다.',
    ].join('\n'),
  })
  create(@RequireChurch() auth: Auth, @Body() dto: CreateCohortDto) {
    return this.cohorts.create(auth.churchId, dto);
  }

  @Get(':id')
  @Permissions('training:read')
  @ApiOperation({
    summary: '기수 상세 (출석 매트릭스)',
    description: [
      '`{ sessions, roster }` 형태로 **회차 × 수강생 표 하나를 그대로 그릴 수 있게** 반환한다.',
      '',
      '각 수강생에는 출석한 회차 id 목록(`attendedSessionIds`)과 출석률이 포함된다.',
    ].join('\n'),
  })
  detail(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number) {
    return this.enrollments.detail(auth.churchId, id);
  }

  @Patch(':id')
  @Permissions('training:write')
  @ApiOperation({
    summary: '기수 수정',
    description: '일정·담당자·비고와 진행 상태(`status`)를 바꾼다. 회차 수는 여기서 바뀌지 않는다(회차 추가 API 사용).',
  })
  update(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCohortDto) {
    return this.cohorts.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @Permissions('training:write')
  @HttpCode(204)
  @ApiOperation({ summary: '기수 삭제', description: '회차·수강·출석 기록까지 함께 soft delete 한다.' })
  @ApiNoContentResponse({ description: '삭제 완료' })
  remove(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number) {
    return this.cohorts.remove(auth.churchId, id);
  }

  @Get(':id/sessions')
  @Permissions('training:read')
  @ApiOperation({ summary: '회차 목록', description: '회차 번호순. 날짜·주제 확인용.' })
  listSessions(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number) {
    return this.cohorts.listSessions(auth.churchId, id);
  }

  @Post(':id/sessions')
  @Permissions('training:write')
  @ApiOperation({ summary: '회차 추가', description: '과정 기본값보다 길게 진행될 때 마지막 번호 다음으로 한 회차를 덧붙인다.' })
  addSession(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number) {
    return this.cohorts.addSession(auth.churchId, id);
  }

  @Patch('sessions/:sessionId')
  @Permissions('training:write')
  @ApiOperation({ summary: '회차 날짜·주제 수정' })
  @ApiParam({ name: 'sessionId', description: '회차 id', type: Number })
  updateSession(@RequireChurch() auth: Auth, @Param('sessionId', ParseIntPipe) sessionId: number, @Body() dto: UpdateSessionDto) {
    return this.cohorts.updateSession(auth.churchId, sessionId, dto);
  }

  @Delete('sessions/:sessionId')
  @Permissions('training:write')
  @HttpCode(204)
  @ApiOperation({
    summary: '회차 삭제',
    description: '그 회차의 출석 기록을 함께 삭제하고, 남은 회차 번호를 1부터 다시 매긴다.',
  })
  @ApiParam({ name: 'sessionId', description: '회차 id', type: Number })
  @ApiNoContentResponse({ description: '삭제 완료' })
  removeSession(@RequireChurch() auth: Auth, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.cohorts.removeSession(auth.churchId, sessionId);
  }

  @Post('sessions/:sessionId/attendance')
  @Permissions('training:write')
  @ApiOperation({
    summary: '훈련 출석 체크 / 해제',
    description: '`present: true` 면 출석 기록 생성, `false` 면 삭제. 멱등이므로 같은 요청을 반복해도 안전하다.',
  })
  @ApiParam({ name: 'sessionId', description: '회차 id', type: Number })
  @ApiOkResponse({ schema: { type: 'object', properties: { present: { type: 'boolean' } } } })
  markAttendance(@RequireChurch() auth: Auth, @Param('sessionId', ParseIntPipe) sessionId: number, @Body() dto: MarkTrainingAttendanceDto) {
    return this.enrollments.markAttendance(auth.churchId, sessionId, dto);
  }

  @Post(':id/enrollments')
  @Permissions('training:write')
  @ApiOperation({
    summary: '수강생 등록 (일괄)',
    description: '`memberIds` 로 여러 명을 한 번에 등록한다. 이미 등록됐거나 없는 교인은 건너뛰고 `{ added, skipped }` 를 반환.',
  })
  @ApiOkResponse({ schema: { type: 'object', properties: { added: { type: 'number' }, skipped: { type: 'number' } } } })
  enroll(@RequireChurch() auth: Auth, @Param('id', ParseIntPipe) id: number, @Body() dto: EnrollMembersDto) {
    return this.enrollments.enroll(auth.churchId, id, dto);
  }
}
