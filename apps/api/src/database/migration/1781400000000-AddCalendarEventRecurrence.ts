import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendarEventRecurrence1781400000000 implements MigrationInterface {
  name = 'AddCalendarEventRecurrence1781400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar_event" ADD "recurrence" character varying`);
    await queryRunner.query(
      `COMMENT ON COLUMN "calendar_event"."recurrence" IS '반복 규칙 토큰 (daily/weekly/biweekly/monthly/yearly), null=반복없음'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "calendar_event" DROP COLUMN "recurrence"`);
  }
}
