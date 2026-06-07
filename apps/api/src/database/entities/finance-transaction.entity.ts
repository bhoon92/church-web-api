import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { bigintTransformer } from '../column-transformer';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 운영 재정 거래 (planning 4.2) — 입금/출금 단위 ledger.
 * flow = income/expense. account_category_id = 계정과목.
 * budget_allocation_id (지출 한정) 가 있으면 부서별 예산 집행으로 집계.
 */
export enum TransactionFlow {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity('finance_transaction')
@Index(['churchId'])
@Index(['churchId', 'date'])
@Index(['churchId', 'fiscalYearId'])
@Index(['budgetAllocationId'])
export class FinanceTransactionEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column({ nullable: true })
  fiscalYearId?: number;

  @Column({ type: 'enum', enum: TransactionFlow })
  flow!: TransactionFlow;

  @Column({ nullable: true })
  accountCategoryId?: number;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  amount!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ comment: '적요/제목' })
  title!: string;

  @Column({ comment: '지출 시 연결된 부서별 예산 (선택)', nullable: true })
  budgetAllocationId?: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ comment: '입력자 account' })
  recorderAccountId!: number;
}
