import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 로그인 정체성. 1 Google 계정 = 1 Account.
 * Account는 N개 Church에 Membership으로 연결 가능 (동일인 다교회 OK).
 * Church/Member entity와 별개 — Member는 교회 안의 성도 row.
 */
@Entity('account')
@Index(['googleId'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['email'], { unique: true, where: 'deleted_at IS NULL' })
export class AccountEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ comment: 'Google sub' })
  googleId!: string;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column({ comment: 'Google profile picture URL', nullable: true })
  pictureUrl?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;
}
