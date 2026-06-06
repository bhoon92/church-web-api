import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 교회 안의 성도 (planning 1.1). 도메인 모델 root — 헌금/출석/사역기록이 모두 member_id에 1:N.
 * lifecycle_stage 가 단일 enum 으로 등록 상태까지 통합.
 *
 * uniqueness: (church_id, name, phone) 부분 unique — 동일 교회 안에서 이름+전화 동일하면 중복 등록 방지.
 *   phone 없는 경우 (방문/익명 등) 는 unique 제약에서 자연스럽게 빠짐.
 */
export enum LifecycleStage {
  VISITOR = 'visitor', // 방문
  NEW = 'new', // 새가족
  REGULAR = 'regular', // 정식
  TRANSFERRED = 'transferred', // 이명
  DECEASED = 'deceased', // 별세
  ABSENT = 'absent', // 장기결석
  ANONYMOUS = 'anonymous', // 익명 (무명 헌금 묶음용)
}

@Entity('members')
@Index(['churchId'])
@Index(['churchId', 'lifecycleStage'])
export class MemberEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'date', nullable: true })
  birth?: string;

  @Column({ type: 'enum', enum: LifecycleStage, default: LifecycleStage.VISITOR })
  lifecycleStage!: LifecycleStage;

  @Column({ comment: '비고/노트', type: 'text', nullable: true })
  note?: string;

  @Column({ comment: '정식 등록일', type: 'date', nullable: true })
  registeredAt?: string;

  @Column({ comment: '세례일', type: 'date', nullable: true })
  baptizedAt?: string;

  @Column({ comment: '입교일', type: 'date', nullable: true })
  confirmedAt?: string;

  // 새가족 등록서 (옵션 B: 별도 entity 안 만들고 nullable 컬럼 흡수)
  @Column({ comment: '이전 교회', nullable: true })
  previousChurch?: string;

  @Column({ comment: '신앙 경력 (년)', type: 'smallint', nullable: true })
  faithYears?: number;

  @Column({ comment: '등록 동기', type: 'text', nullable: true })
  registrationReason?: string;

  @Column({ comment: '직업', nullable: true })
  occupation?: string;

  @Column({ comment: '주소', nullable: true })
  address?: string;

  @Column({ comment: '봉투 원본 이름 (헌금 batch entry 매칭용)', nullable: true })
  rawDonorName?: string;
}
