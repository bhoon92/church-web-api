import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { TrainingFormat } from '@src/database/entities/training-course.entity';

export class CreateCourseDto {
  @IsString()
  @Length(1, 40)
  name!: string;

  /** 진행 형태. weekly=매주, retreat=수련회, intensive=합숙. 미지정 시 weekly. */
  @IsOptional()
  @IsEnum(TrainingFormat)
  format?: TrainingFormat;

  /** 기본 회차 수 — 기수를 열 때 이만큼 회차가 자동 생성된다. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  defaultSessionCount?: number;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
