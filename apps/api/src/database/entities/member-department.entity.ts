import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * Member ↔ Department N:N + 기간 + 리더 표현.
 * 현재 소속: end_date IS NULL.
 * 변경 이력: 동일 (member, department) 에 대해 endDate 가 채워진 과거 row + endDate IS NULL 인 현재 row 동시 존재 가능.
 */
@Entity('member_departments')
@Index(['churchId'])
@Index(['memberId'])
@Index(['departmentId'])
@Index(['memberId', 'departmentId'], {
  unique: true,
  where: 'end_date IS NULL AND deleted_at IS NULL',
})
export class MemberDepartmentEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  memberId!: number;

  @Column()
  departmentId!: number;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @Column({ default: false })
  isLeader!: boolean;

  @Column({ comment: '리더 호칭 (부서장/부감/총무 등 free-form)', nullable: true })
  roleLabel?: string;
}
