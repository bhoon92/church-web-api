import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleCalendar1781142044437 implements MigrationInterface {
  name = 'AddGoogleCalendar1781142044437';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "google_calendar_connection" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "account_id" integer NOT NULL, "google_email" character varying NOT NULL, "refresh_token" text NOT NULL, "access_token" text, "access_token_expires_at" TIMESTAMP WITH TIME ZONE, "target_calendar_id" character varying NOT NULL, "calendar_id" integer array NOT NULL DEFAULT '{}', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f303491364ac0d47bd034fcc57a" PRIMARY KEY ("id")); COMMENT ON COLUMN "google_calendar_connection"."google_email" IS '연결한 구글 계정 이메일'; COMMENT ON COLUMN "google_calendar_connection"."refresh_token" IS 'offline refresh token (평문, 암호화 TODO)'; COMMENT ON COLUMN "google_calendar_connection"."access_token" IS '캐시된 access token'; COMMENT ON COLUMN "google_calendar_connection"."access_token_expires_at" IS 'access token 만료 시각'; COMMENT ON COLUMN "google_calendar_connection"."target_calendar_id" IS 'push 대상 구글 캘린더 id'; COMMENT ON COLUMN "google_calendar_connection"."calendar_id" IS 'push 할 앱 calendar 레이어 (빈 배열=전체)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5d31916576dc70c95e5af248c2" ON "google_calendar_connection" ("account_id", "church_id") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_10f9234ae660f0043c4e66c4c7" ON "google_calendar_connection" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "google_calendar_event_link" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id" SERIAL NOT NULL, "connection_id" integer NOT NULL, "calendar_event_id" integer NOT NULL, "google_event_id" character varying NOT NULL, CONSTRAINT "PK_7fc357a0f0a96d64003d6dab257" PRIMARY KEY ("id")); COMMENT ON COLUMN "google_calendar_event_link"."google_event_id" IS '구글 캘린더 일정 id'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_0c7d85efce3f4e01b2013bc4dc" ON "google_calendar_event_link" ("connection_id", "calendar_event_id") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_3551749c928275bba2162c0074" ON "google_calendar_event_link" ("calendar_event_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_fecb1a7415bd06c14d4c00f455" ON "google_calendar_event_link" ("connection_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_fecb1a7415bd06c14d4c00f455"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3551749c928275bba2162c0074"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0c7d85efce3f4e01b2013bc4dc"`);
    await queryRunner.query(`DROP TABLE "google_calendar_event_link"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_10f9234ae660f0043c4e66c4c7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5d31916576dc70c95e5af248c2"`);
    await queryRunner.query(`DROP TABLE "google_calendar_connection"`);
  }
}
