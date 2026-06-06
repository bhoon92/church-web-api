import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 목장/구역 — 생활 기반 소그룹.
 * per-church 사용자 정의. 명칭(목장/구역/셀)은 교회마다 다름 — entity 이름은 SmallGroup으로 중립화.
 */
@Entity('small_groups')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class SmallGroupEntity extends BaseDateEntityWithDeletedAt {
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
