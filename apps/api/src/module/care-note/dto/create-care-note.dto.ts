import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { CareNoteType } from '@src/database/entities/care-note.entity';

export class CreateCareNoteDto {
  /** 기록 종류. 미지정 시 면담(meeting). */
  @IsOptional()
  @IsEnum(CareNoteType)
  type?: CareNoteType;

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
