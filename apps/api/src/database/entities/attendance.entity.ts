import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 출석 (planning 2) — row 존재 = 해당 예배·날짜에 출석.
 * (worship_service_id, member_id, date) 활성 row 는 한 개 (partial unique).
 * 결석은 row 부재로 표현 → 출석률 = 출석 row 수 / 대상 멤버 수.
 */
@Entity('attendance')
@Index(['churchId'])
@Index(['churchId', 'worshipServiceId', 'date'])
@Index(['memberId'])
@Index(['worshipServiceId', 'memberId', 'date'], {
  unique: true,
  where: 'deleted_at IS NULL',
})
export class AttendanceEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  worshipServiceId!: number;

  @Column()
  memberId!: number;

  @Column({ type: 'date' })
  date!: string;
}
