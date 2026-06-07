import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 달력 일정 (planning 5.1). 갤러리 Event(행사=폴더) 와 다른 개념 → 테이블명 calendar_event.
 * allDay=true 면 시간 무시(종일). 반복(RRULE)은 MVP 범위 밖.
 */
@Entity('calendar_event')
@Index(['churchId'])
@Index(['calendarId'])
@Index(['churchId', 'startAt'])
export class CalendarEventEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  calendarId!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: false })
  allDay!: boolean;

  @Column({ type: 'timestamptz' })
  startAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endAt?: Date;
}
