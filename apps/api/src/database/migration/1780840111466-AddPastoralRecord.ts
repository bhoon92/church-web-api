import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPastoralRecord1780840111466 implements MigrationInterface {
  name = 'AddPastoralRecord1780840111466';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."pastoral_record_type_enum" AS ENUM('visit', 'newcomer_education', 'counsel', 'etc')`);
    await queryRunner.query(
      `CREATE TABLE "pastoral_record" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "recorder_account_id" integer NOT NULL, "type" "public"."pastoral_record_type_enum" NOT NULL DEFAULT 'visit', "date" date NOT NULL, "location" character varying, "content" text NOT NULL, "prayer_request" text, "status_note" text, CONSTRAINT "PK_0a1fab93f59b585ca6936dde883" PRIMARY KEY ("id")); COMMENT ON COLUMN "pastoral_record"."member_id" IS '대상 성도'; COMMENT ON COLUMN "pastoral_record"."recorder_account_id" IS '작성자 account'; COMMENT ON COLUMN "pastoral_record"."location" IS '장소'; COMMENT ON COLUMN "pastoral_record"."content" IS '본문'; COMMENT ON COLUMN "pastoral_record"."prayer_request" IS '기도제목'; COMMENT ON COLUMN "pastoral_record"."status_note" IS '현재 상황 노트'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_e0bbd7a9144a6a1311ba5faff6" ON "pastoral_record" ("church_id", "date") `);
    await queryRunner.query(`CREATE INDEX "IDX_be1caef751145c63e305faab54" ON "pastoral_record" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_04c1cac1b8bf5058da3bad4d8b" ON "pastoral_record" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_04c1cac1b8bf5058da3bad4d8b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_be1caef751145c63e305faab54"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e0bbd7a9144a6a1311ba5faff6"`);
    await queryRunner.query(`DROP TABLE "pastoral_record"`);
    await queryRunner.query(`DROP TYPE "public"."pastoral_record_type_enum"`);
  }
}
