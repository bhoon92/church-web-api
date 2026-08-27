import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  COMPLETED = 'completed',
  DROPPED = 'dropped',
}

/**
 * 수강 — 기수 × 교인. 양성 이력의 알맹이.
 * 수료(completed) 전환은 출석률로 자동 판정하지 않고 담당자가 확정한다 (planning 00.3).
 */
@Entity('training_enrollment')
@Index(['churchId'])
@Index(['cohortId'])
@Index(['memberId'])
@Index(['cohortId', 'memberId'], { unique: true, where: 'deleted_at IS NULL' })
export class TrainingEnrollmentEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  cohortId!: number;

  @Column()
  memberId!: number;

  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.ENROLLED })
  status!: EnrollmentStatus;

  @Column({ type: 'date' })
  enrolledAt!: string;

  /** 수강 중으로 되돌리면 다시 null 이 되므로 nullable 을 타입에도 드러낸다. */
  @Column({ comment: '수료(또는 중도포기) 확정일', type: 'date', nullable: true })
  closedAt?: string | null;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
