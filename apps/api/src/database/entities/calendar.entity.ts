import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 달력 레이어 (planning 5.1) — 공지/전체/부서/사역팀/목장/개인 등 구분 단위.
 * per-church. 색상은 UI 표시 + iCal 구분용. 사용자는 구독에서 포함 달력을 선택.
 */
@Entity('calendar')
@Index(['churchId'])
export class CalendarEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  name!: string;

  @Column({ comment: 'UI/구분용 색상 (oklch 또는 hex)' })
  color!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;
}
