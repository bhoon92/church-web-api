import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseDateEntityWithDeletedAt } from './base-date.entity';

export enum MembershipRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  STAFF = 'staff',
  VIEWER = 'viewer',
}

@Entity('membership')
@Index(['accountId', 'churchId'], { unique: true, where: 'deleted_at IS NULL' })
@Index(['churchId'])
export class MembershipEntity extends BaseDateEntityWithDeletedAt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  accountId!: number;

  @Column()
  churchId!: number;

  @Column({ type: 'enum', enum: MembershipRole, default: MembershipRole.STAFF })
  role!: MembershipRole;

  @Column({ nullable: true })
  memberId?: number;
}
