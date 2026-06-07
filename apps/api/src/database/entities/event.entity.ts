import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 행사 (planning 5.2/5.3) — 사진 갤러리의 "폴더" 모델.
 * 수련회/절기예배/행사 단위로 사진을 묶음. per-church.
 */
@Entity('event')
@Index(['churchId'])
@Index(['churchId', 'date'])
export class EventEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  name!: string;

  @Column({ type: 'date', nullable: true })
  date?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;
}
