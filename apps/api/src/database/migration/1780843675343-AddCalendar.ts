import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCalendar1780843675343 implements MigrationInterface {
  name = 'AddCalendar1780843675343';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "calendar" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "color" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2492fb846a48ea16d53864e3267" PRIMARY KEY ("id")); COMMENT ON COLUMN "calendar"."color" IS 'UI/구분용 색상 (oklch 또는 hex)'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_fc3f62ac9854cc94dcab08edb3" ON "calendar" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "calendar_subscription" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "account_id" integer NOT NULL, "feed_token" character varying NOT NULL, "calendar_ids" integer array NOT NULL DEFAULT '{}', CONSTRAINT "PK_6f7bc98fda02baf865f24820520" PRIMARY KEY ("id")); COMMENT ON COLUMN "calendar_subscription"."feed_token" IS 'iCal 피드 접근 토큰 (URL 내 secret)'`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_954a147163e6183fee6ed8c611" ON "calendar_subscription" ("account_id", "church_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c64c94df68716b3e846c71aa10" ON "calendar_subscription" ("feed_token") `);
    await queryRunner.query(
      `CREATE TABLE "calendar_event" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "calendar_id" integer NOT NULL, "title" character varying NOT NULL, "location" character varying, "description" text, "all_day" boolean NOT NULL DEFAULT false, "start_at" TIMESTAMP WITH TIME ZONE NOT NULL, "end_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_176fe24e6eb48c3fef696c7641f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_7b63984097769b2e372b9e1dd9" ON "calendar_event" ("church_id", "start_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_b8a97d25d9efe9b656b960f8b3" ON "calendar_event" ("calendar_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_35e7f9e69115fb231657290f3c" ON "calendar_event" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_35e7f9e69115fb231657290f3c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b8a97d25d9efe9b656b960f8b3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7b63984097769b2e372b9e1dd9"`);
    await queryRunner.query(`DROP TABLE "calendar_event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c64c94df68716b3e846c71aa10"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_954a147163e6183fee6ed8c611"`);
    await queryRunner.query(`DROP TABLE "calendar_subscription"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fc3f62ac9854cc94dcab08edb3"`);
    await queryRunner.query(`DROP TABLE "calendar"`);
  }
}
