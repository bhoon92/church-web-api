import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { MissionaryStage } from '@src/database/entities/missionary-profile.entity';

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

export class CreateMissionaryDto {
  @IsInt()
  @Min(1)
  memberId!: number;

  /** 시작 단계. 생략 시 후보(candidate). */
  @IsOptional()
  @IsEnum(MissionaryStage)
  stage?: MissionaryStage;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  country?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  region?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  fieldWork?: string;

  /** 소속 사역팀 (보통 해외선교팀). */
  @IsOptional()
  @IsInt()
  @Min(1)
  ministryId?: number;

  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'commissionedAt must be YYYY-MM-DD' })
  commissionedAt?: string;

  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'departedAt must be YYYY-MM-DD' })
  departedAt?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}

/** 프로필 정보 수정 — 단계 변경은 별도 엔드포인트(전이 이력이 남아야 하므로). */
export class UpdateMissionaryDto extends PartialType(CreateMissionaryDto) {}

export class ChangeStageDto {
  @IsEnum(MissionaryStage)
  stage!: MissionaryStage;

  /** 전이일. 생략 시 오늘. */
  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'changedAt must be YYYY-MM-DD' })
  changedAt?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}

export class ListMissionaryQueryDto {
  @IsOptional()
  @IsEnum(MissionaryStage)
  stage?: MissionaryStage;

  /** 'active' 면 파송확정·현지·안식년만 (대시보드 기준과 동일). */
  @IsOptional()
  @IsString()
  scope?: 'active' | 'all';
}
