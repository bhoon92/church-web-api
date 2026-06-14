import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import type { AffiliationKind } from '@src/module/affiliation/affiliation.service';

const AFFILIATION_KINDS = ['department', 'ministry', 'smallGroup'] as const;

export class ListMemberQueryDto {
  /** 이름·전화 부분 일치 */
  @IsOptional()
  @IsString()
  q?: string;

  /** 소속 검색: 부서/사역팀/목장 종류 */
  @IsOptional()
  @IsIn(AFFILIATION_KINDS)
  affiliationKind?: AffiliationKind;

  /** 소속 검색: reference id (affiliationKind 와 함께) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  affiliationId?: number;

  /** 재적상태 필터 (status id) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  statusId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
