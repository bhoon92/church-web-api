import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/** 부서 — 연령 기반 reference. */
@Entity('department')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class DepartmentEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;
}
