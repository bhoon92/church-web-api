import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum TrainingFormat {
  /** 매주 반복 (예: 믿음학교 12주). */
  WEEKLY = 'weekly',
  /** 3박4일 등 연속 일정 수련회. */
  RETREAT = 'retreat',
  /** 합숙형 집중 훈련. */
  INTENSIVE = 'intensive',
  ETC = 'etc',
}

/** 훈련 과정 정의 — 기수(cohort)를 반복해서 여는 틀. */
@Entity('training_course')
@Index(['churchId'])
@Index(['churchId', 'name'], { unique: true, where: 'deleted_at IS NULL' })
export class TrainingCourseEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: TrainingFormat, default: TrainingFormat.WEEKLY })
  format!: TrainingFormat;

  @Column({ comment: '기본 회차 수 — 기수 개설 시 회차 자동 생성에 사용', type: 'smallint', default: 1 })
  defaultSessionCount!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;

  @Column({ default: true })
  isActive!: boolean;
}
