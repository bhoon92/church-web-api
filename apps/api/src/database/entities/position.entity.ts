import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/** 직분 reference — 성도/집사/장로/목사 등. */
@Entity('position')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class PositionEntity extends BaseDateEntityWithDeletedAt {
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
