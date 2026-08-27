import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import { CohortStatus } from '@src/database/entities/training-cohort.entity';
import { EnrollmentStatus } from '@src/database/entities/training-enrollment.entity';

const YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCohortDto {
  @IsInt()
  @Min(1)
  courseId!: number;

  /** 기수 번호. 생략하면 해당 과정의 마지막 기수 + 1 로 자동 부여된다. */
  @IsOptional()
  @IsInt()
  @Min(1)
  ordinal?: number;

  @Matches(YYYY_MM_DD, { message: 'startDate must be YYYY-MM-DD' })
  startDate!: string;

  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'endDate must be YYYY-MM-DD' })
  endDate?: string;

  /** 생성할 회차 수. 생략하면 과정의 defaultSessionCount 를 따른다. */
  @IsOptional()
  @IsInt()
  @Min(1)
  sessionCount?: number;

  /** 담당 사역자 (member id). */
  @IsOptional()
  @IsInt()
  @Min(1)
  leaderMemberId?: number;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}

export class UpdateCohortDto extends PartialType(CreateCohortDto) {
  @IsOptional()
  @IsEnum(CohortStatus)
  status?: CohortStatus;
}

export class ListCohortQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  courseId?: number;

  @IsOptional()
  @IsEnum(CohortStatus)
  status?: CohortStatus;
}

export class UpdateSessionDto {
  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  topic?: string;
}

export class EnrollMembersDto {
  /** 한 번에 여러 명 등록. 이미 등록된 교인은 조용히 건너뛴다. */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsInt({ each: true })
  @Min(1, { each: true })
  memberIds!: number[];
}

export class UpdateEnrollmentDto {
  /** enrolled → completed(수료) / dropped(중도포기). */
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;

  /** 수료/중도포기 확정일. 생략 시 오늘. */
  @IsOptional()
  @Matches(YYYY_MM_DD, { message: 'closedAt must be YYYY-MM-DD' })
  closedAt?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}

export class MarkTrainingAttendanceDto {
  @IsInt()
  @Min(1)
  enrollmentId!: number;

  @IsBoolean()
  present!: boolean;
}
