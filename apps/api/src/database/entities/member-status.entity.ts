import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/** 성도 재적상태 reference (교회별 편집 가능). 기존 lifecycleStage enum 대체. */
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

  /** 시스템 의미 키: 'anonymous'(무명헌금) | 'new'(새가족) | null. 있으면 사용자 삭제 불가. */
  @Column({ type: 'varchar', nullable: true })
  systemKey?: string;

  /** 출석 명단 포함 여부 (별세·이명·익명은 false). */
  @Column({ default: true })
  countsInRoster!: boolean;
}
