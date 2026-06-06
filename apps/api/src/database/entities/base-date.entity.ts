import { CreateDateColumn, DeleteDateColumn, UpdateDateColumn } from 'typeorm';

export class BaseDateEntity {
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

export class BaseDateEntityWithDeletedAt extends BaseDateEntity {
  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt!: Date | null;
}
