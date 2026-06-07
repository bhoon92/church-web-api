import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntity } from './base-date.entity';

/**
 * 사용자별 달력 구독 (planning 5.1 UserCalendarSubscription).
 * feed_token 으로 인증 없이 .ics 피드 접근 (캘린더 앱은 쿠키 전송 불가).
 * calendar_ids = 피드에 포함할 달력 목록 (사람마다 다른 달력).
 */
@Entity('calendar_subscription')
@Index(['feedToken'], { unique: true })
@Index(['accountId', 'churchId'], { unique: true })
export class CalendarSubscriptionEntity extends BaseDateEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  accountId!: number;

  @Column({ comment: 'iCal 피드 접근 토큰 (URL 내 secret)' })
  feedToken!: string;

  @Column({ type: 'int', array: true, default: () => "'{}'" })
  calendarIds!: number[];
}
