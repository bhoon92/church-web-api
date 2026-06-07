import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { bigintTransformer } from '../column-transformer';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 부서·팀·목장별 할당 예산 (planning 4.2.1) — 연초에 각 단위에 예산 할당.
 * 지출(FinanceTransaction.budgetAllocationId)이 묶여 잔여 자동 계산.
 * target_kind + target_id 로 Department/Ministry/SmallGroup 중 하나 지정.
 */
export enum BudgetTargetKind {
  DEPARTMENT = 'department',
  MINISTRY = 'ministry',
  SMALL_GROUP = 'small_group',
}

@Entity('budget_allocation')
@Index(['churchId'])
@Index(['churchId', 'fiscalYearId'])
@Index(['fiscalYearId', 'targetKind', 'targetId'], { unique: true, where: 'deleted_at IS NULL' })
export class BudgetAllocationEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  fiscalYearId!: number;

  @Column({ type: 'enum', enum: BudgetTargetKind })
  targetKind!: BudgetTargetKind;

  @Column()
  targetId!: number;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
