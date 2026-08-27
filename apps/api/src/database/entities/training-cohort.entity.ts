import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum CohortStatus {
  PLANNED = 'planned',
  ONGOING = 'ongoing',
  CLOSED = 'closed',
}

/** 훈련 기수 — "믿음학교 5기". 실제 사람이 붙는 단위. */
@Entity('training_cohort')
@Index(['churchId'])
@Index(['churchId', 'status'])
@Index(['courseId'])
@Index(['courseId', 'ordinal'], { unique: true, where: 'deleted_at IS NULL' })
export class TrainingCohortEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  courseId!: number;

  @Column({ comment: '기수 번호 (5기 → 5)', type: 'smallint' })
  ordinal!: number;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ comment: '종료(예정)일', type: 'date', nullable: true })
  endDate?: string;

  @Column({ type: 'enum', enum: CohortStatus, default: CohortStatus.PLANNED })
  status!: CohortStatus;

  @Column({ comment: '담당 사역자 (member)', nullable: true })
  leaderMemberId?: number;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
