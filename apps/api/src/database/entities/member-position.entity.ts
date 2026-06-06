import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 직분 이력 — 한 성도는 활성 직분 1개만 (end_date IS NULL row).
 * 승직 시: 기존 row endDate 설정 + 새 row 생성 (트랜잭션).
 * partial unique 로 동시 2개 활성 방지.
 */
@Entity('member_positions')
@Index(['churchId'])
@Index(['memberId'])
@Index(['positionId'])
@Index(['memberId'], {
  unique: true,
  where: 'end_date IS NULL AND deleted_at IS NULL',
})
export class MemberPositionEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  memberId!: number;

  @Column()
  positionId!: number;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ comment: '비고 (취임 경위 등)', type: 'text', nullable: true })
  note?: string;
}
