import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { bigintTransformer } from '../column-transformer';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

/**
 * 사진 (planning 5.3) — 행사(Event=폴더)에 속한 S3 객체 메타데이터.
 * 실제 파일은 S3, DB 는 key/메타만 보관. 조회 시 presigned GET URL 발급.
 */
@Entity('photo')
@Index(['churchId'])
@Index(['eventId'])
export class PhotoEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  churchId!: number;

  @Column()
  eventId!: number;

  @Column({ comment: 'S3 object key' })
  s3Key!: string;

  @Column()
  originalName!: string;

  @Column({ nullable: true })
  contentType?: string;

  @Column({ type: 'bigint', transformer: bigintTransformer, nullable: true })
  size?: number;

  @Column({ comment: '업로더 account' })
  uploaderAccountId!: number;

  @Column({ type: 'smallint', default: 0 })
  sortOrder!: number;
}
