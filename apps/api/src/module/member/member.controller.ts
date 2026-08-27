import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiNoContentResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@src/common/swagger/api-auth.decorator';
import { SwaggerTag } from '@src/common/swagger/swagger-tags';
import { RequireChurch } from '@src/module/auth/decorators/current-auth.decorator';
import { Permissions } from '@src/module/auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '@src/module/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '@src/module/auth/guards/permissions.guard';
import type { AuthContext } from '@src/module/auth/types/auth-context';
import { CreateMemberDto } from './dto/create-member.dto';
import { ListMemberQueryDto } from './dto/list-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberService } from './member.service';

@ApiTags(SwaggerTag.MEMBER)
@ApiAuth()
@Controller('members')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MemberController {
  constructor(private readonly members: MemberService) {}

  @Get()
  @Permissions('member:read')
  @ApiOperation({
    summary: '교인 목록 (검색·페이징)',
    description: [
      '활성 교회의 교인을 최근 등록순으로 반환한다.',
      '',
      '- `q`: 이름·전화 부분 일치',
      '- `affiliationKind` + `affiliationId`: 특정 부서/사역팀/목장 소속만 (둘을 함께 보내야 함)',
      '- `statusId`: 재적상태 필터',
      '- 응답: `{ items, total, page, pageSize, counts }` — `counts` 는 재적상태별 인원 수(필터 배지용)',
    ].join('\n'),
  })
  list(@RequireChurch() auth: AuthContext & { churchId: number }, @Query() query: ListMemberQueryDto) {
    return this.members.list(auth.churchId, query);
  }

  @Get(':id')
  @Permissions('member:read')
  @ApiOperation({
    summary: '교인 상세',
    description: '기본 정보에 재적상태 이름, 소속(부서/사역팀/목장) 목록, 직분 이력을 합쳐서 반환한다.',
  })
  @ApiNotFoundResponse({ description: '해당 교회에 없는 교인 id' })
  detail(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.members.findById(auth.churchId, id);
  }

  @Post()
  @Permissions('member:write')
  @ApiOperation({
    summary: '교인 등록',
    description: '`statusId` 를 생략하면 활성 재적상태 중 sortOrder 가 가장 앞인 값(보통 "방문")으로 자동 설정된다.',
  })
  create(@RequireChurch() auth: AuthContext & { churchId: number }, @Body() dto: CreateMemberDto) {
    return this.members.create(auth.churchId, dto);
  }

  @Patch(':id')
  @Permissions('member:write')
  @ApiOperation({ summary: '교인 정보 수정', description: '보낸 필드만 갱신하고, 갱신된 상세(상세 조회와 같은 형태)를 반환한다.' })
  update(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) {
    return this.members.update(auth.churchId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @Permissions('member:write')
  @ApiOperation({ summary: '교인 삭제', description: '**soft delete** (deletedAt 기록). 헌금·출석 등 과거 데이터는 그대로 남는다.' })
  @ApiNoContentResponse({ description: '삭제 완료' })
  remove(@RequireChurch() auth: AuthContext & { churchId: number }, @Param('id', ParseIntPipe) id: number) {
    return this.members.remove(auth.churchId, id);
  }
}
