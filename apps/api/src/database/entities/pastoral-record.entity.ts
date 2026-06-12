import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum PastoralRecordType {
  VISIT = 'visit', // 심방
  NEWCOMER_EDUCATION = 'newcomer_education', // 새가족교육
  COUNSEL = 'counsel', // 상담
  ETC = 'etc', // 기타
}

/** 사역 기록 — 심방·새가족교육·상담 노트. */
@Entity('pastoral_record')
@Index(['churchId'])
@Index(['memberId'])
@Index(['churchId', 'date'])
export class PastoralRecordEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column({ comment: '대상 성도' })
  memberId!: number;

  @Column({ comment: '작성자 account' })
  recorderAccountId!: number;

  @Column({ type: 'enum', enum: PastoralRecordType, default: PastoralRecordType.VISIT })
  type!: PastoralRecordType;

  @Column({ type: 'date' })
  date!: string;

  @Column({ comment: '장소', nullable: true })
  location?: string;

  @Column({ comment: '본문', type: 'text' })
  content!: string;

  @Column({ comment: '기도제목', type: 'text', nullable: true })
  prayerRequest?: string;

  @Column({ comment: '현재 상황 노트', type: 'text', nullable: true })
  statusNote?: string;
}
