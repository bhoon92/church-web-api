import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 사역팀 — 봉사 단위 (찬양팀/새가족팀/예배안내팀/미디어팀 등).
 * 한 성도가 여러 사역팀 겸직 흔함. per-church 사용자 정의.
 */
@Entity('ministries')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class MinistryEntity extends BaseDateEntityWithDeletedAt {
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
