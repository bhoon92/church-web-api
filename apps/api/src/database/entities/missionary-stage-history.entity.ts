import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';
import { MissionaryStage } from './missionary-profile.entity';

/** 파송 단계 전이 이력 — "언제 어떤 단계로 갔는지". 프로필의 stage 는 이 이력의 최신값. */
@Entity('missionary_stage_history')
@Index(['churchId'])
@Index(['missionaryId'])
@Index(['churchId', 'changedAt'])
export class MissionaryStageHistoryEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  missionaryId!: number;

  @Column({ comment: '이전 단계 (최초 등록 시 null)', type: 'enum', enum: MissionaryStage, nullable: true })
  fromStage?: MissionaryStage;

  @Column({ type: 'enum', enum: MissionaryStage })
  toStage!: MissionaryStage;

  @Column({ type: 'date' })
  changedAt!: string;

  @Column({ comment: '기록자 account' })
  recorderAccountId!: number;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
