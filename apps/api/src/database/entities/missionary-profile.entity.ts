import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/** 파송 트랙 단계. 재적상태(member_status)와는 축이 다르다 (planning 00.4). */
export enum MissionaryStage {
  /** 후보 — 파송 의사를 밝힌 단계. */
  CANDIDATE = 'candidate',
  /** 훈련 중 — 파송 전 준비. */
  TRAINING = 'training',
  /** 파송 확정 — 아직 출국 전. */
  COMMISSIONED = 'commissioned',
  /** 현지 사역 중. */
  FIELD = 'field',
  /** 안식년/일시 귀국. */
  FURLOUGH = 'furlough',
  /** 사역 마치고 복귀. */
  RETURNED = 'returned',
  /** 중단·종료. */
  ENDED = 'ended',
}

/** 진행 중으로 간주하는 단계 — 대시보드 '현재 파송 인원' 집계 기준. */
export const ACTIVE_MISSIONARY_STAGES: MissionaryStage[] = [MissionaryStage.COMMISSIONED, MissionaryStage.FIELD, MissionaryStage.FURLOUGH];

/** 선교사 프로필 — 교인 1명당 최대 1개. 현재 단계는 여기, 전이 과정은 stage_history 에. */
@Entity('missionary_profile')
@Index(['churchId'])
@Index(['churchId', 'stage'])
@Index(['memberId'], { unique: true, where: 'deleted_at IS NULL' })
export class MissionaryProfileEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  memberId!: number;

  @Column({ type: 'enum', enum: MissionaryStage, default: MissionaryStage.CANDIDATE })
  stage!: MissionaryStage;

  @Column({ comment: '파송 국가', nullable: true })
  country?: string;

  @Column({ comment: '지역/도시', nullable: true })
  region?: string;

  @Column({ comment: '사역 내용 요약', type: 'text', nullable: true })
  fieldWork?: string;

  @Column({ comment: '소속 사역팀 (보통 해외선교팀)', nullable: true })
  ministryId?: number;

  @Column({ comment: '파송 확정일', type: 'date', nullable: true })
  commissionedAt?: string;

  @Column({ comment: '출국/현지 도착일', type: 'date', nullable: true })
  departedAt?: string;

  @Column({ comment: '복귀/종료일', type: 'date', nullable: true })
  endedAt?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
