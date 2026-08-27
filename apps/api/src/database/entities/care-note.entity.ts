import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum CareNoteType {
  /** 일대일 면담. */
  MEETING = 'meeting',
  /** 새가족 양육/제자훈련 노트. */
  NURTURE = 'nurture',
  /** 상담. */
  COUNSEL = 'counsel',
  /** 파송 선교사의 현지 보고. */
  FIELD_REPORT = 'field_report',
  ETC = 'etc',
}

/**
 * 양육기록 — 면담·양육·상담·파송보고 노트 (구 pastoral_record).
 * 심방 중심이던 것을 청년 양성 맥락으로 재정의했다 (planning 00.5).
 */
@Entity('care_note')
@Index(['churchId'])
@Index(['memberId'])
@Index(['churchId', 'date'])
export class CareNoteEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column({ comment: '대상 교인' })
  memberId!: number;

  @Column({ comment: '작성자 account' })
  recorderAccountId!: number;

  @Column({ type: 'enum', enum: CareNoteType, default: CareNoteType.MEETING })
  type!: CareNoteType;

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
