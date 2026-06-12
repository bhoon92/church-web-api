import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/** 달력 일정. */
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
