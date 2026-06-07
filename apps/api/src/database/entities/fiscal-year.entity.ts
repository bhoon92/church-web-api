import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 회계연도 (planning 4.2) — per-church. 교회가 기간 자유 지정 (1/1~12/31, 3/1~2/28 등).
 * 예산/결산/헌금 집계가 fiscal_year_id 에 묶임. is_current = true 인 row 가 현재 연도.
 */
@Entity('fiscal_year')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class FiscalYearEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column({ comment: '예: 2026 회계연도' })
  name!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({ default: false })
  isCurrent!: boolean;
}
