import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LifecycleStage } from '@src/database/entities/member.entity';

export class ListMemberQueryDto {
  /** 이름·전화·이전교회 부분 일치 */
  @IsOptional()
  @IsString()
  q?: string;

  /** 다중 stage 필터: ?stage=regular,new 또는 ?stage=regular&stage=new */
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').filter(Boolean);
    return value;
  })
  @IsEnum(LifecycleStage, { each: true })
  stage?: LifecycleStage[];

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
