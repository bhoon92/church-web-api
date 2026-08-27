import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 재적상태 reference (교회별 편집 가능).
 * 키퍼스처치 기준에서는 단순 분류가 아니라 **양성 파이프라인 그 자체**다:
 * 방문 → 새가족 → 정착 → 훈련생 → 사역자 → 파송 (planning 00.2).
 */
@Entity('member_status')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class MemberStatusEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  name!: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;

  /**
   * 시스템 의미 키. 있으면 사용자 삭제 불가.
   * 'anonymous'(무명헌금) | 'new'(새가족) | 'trainee'(훈련생) | 'worker'(사역자) | 'commissioned'(파송) | null
   */
  @Column({ type: 'varchar', nullable: true })
  systemKey?: string;

  /** 출석 명단 포함 여부 (별세·이명·익명·파송은 false — 파송자는 현지에 있어 주일 출석 대상이 아니다). */
  @Column({ default: true })
  countsInRoster!: boolean;
}
