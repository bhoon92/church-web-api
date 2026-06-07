import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { bigintTransformer } from '../column-transformer';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 개인 헌금 (planning 4.1) — 모든 헌금은 member_id non-null (무명/미등록도 member row).
 * 연말정산 영수증 = member 별 calendar-year 합계.
 * raw_donor_name: 봉투 원본 이름 (매칭 정정용).
 */
@Entity('offering')
@Index(['churchId'])
@Index(['churchId', 'date'])
@Index(['memberId'])
@Index(['offeringCategoryId'])
export class OfferingEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column({ comment: '헌금자 성도' })
  memberId!: number;

  @Column()
  offeringCategoryId!: number;

  @Column({ comment: '연결된 예배 (선택)', nullable: true })
  worshipServiceId?: number;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ comment: '봉투 원본 이름', nullable: true })
  rawDonorName?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ comment: '입력자 account' })
  recorderAccountId!: number;
}
