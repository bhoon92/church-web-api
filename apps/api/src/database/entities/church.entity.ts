import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum ChurchStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
}

@Entity('church')
@Index(['slug'], { unique: true, where: 'deleted_at IS NULL' })
export class ChurchEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ comment: '교회 url slug — 추후 도메인/링크 등에 사용', nullable: true })
  slug?: string;

  @Column({ comment: '사업자등록번호 / 고유번호 — 영수증 발급 주체', nullable: true })
  registrationNumber?: string;

  @Column({ comment: '대표자(담임목사)', nullable: true })
  representative?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ comment: '로고 storage key', nullable: true })
  logoUrl?: string;

  @Column({ comment: '기본 회계연도 시작월 (1-12)', type: 'smallint', default: 1 })
  fiscalYearStartMonth!: number;

  @Column({ type: 'enum', enum: ChurchStatus, default: ChurchStatus.TRIAL })
  status!: ChurchStatus;
}
