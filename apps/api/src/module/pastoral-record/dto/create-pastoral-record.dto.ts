import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { PastoralRecordType } from '@src/database/entities/pastoral-record.entity';

export class CreatePastoralRecordDto {
  @IsOptional()
  @IsEnum(PastoralRecordType)
  type?: PastoralRecordType;

  /** 기록일 (YYYY-MM-DD). 미지정 시 오늘. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  location?: string;

  @IsString()
  @Length(1, 5000)
  content!: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  prayerRequest?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  statusNote?: string;
}
