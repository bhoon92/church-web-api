import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMember1780759137750 implements MigrationInterface {
  name = 'AddMember1780759137750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."members_lifecycle_stage_enum" AS ENUM('visitor', 'new', 'regular', 'transferred', 'deceased', 'absent', 'anonymous')`
    );
    await queryRunner.query(
      `CREATE TABLE "members" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "phone" character varying, "birth" date, "lifecycle_stage" "public"."members_lifecycle_stage_enum" NOT NULL DEFAULT 'visitor', "note" text, "registered_at" date, "baptized_at" date, "confirmed_at" date, "previous_church" character varying, "faith_years" smallint, "registration_reason" text, "occupation" character varying, "address" character varying, "raw_donor_name" character varying, CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id")); COMMENT ON COLUMN "members"."note" IS '비고/노트'; COMMENT ON COLUMN "members"."registered_at" IS '정식 등록일'; COMMENT ON COLUMN "members"."baptized_at" IS '세례일'; COMMENT ON COLUMN "members"."confirmed_at" IS '입교일'; COMMENT ON COLUMN "members"."previous_church" IS '이전 교회'; COMMENT ON COLUMN "members"."faith_years" IS '신앙 경력 (년)'; COMMENT ON COLUMN "members"."registration_reason" IS '등록 동기'; COMMENT ON COLUMN "members"."occupation" IS '직업'; COMMENT ON COLUMN "members"."address" IS '주소'; COMMENT ON COLUMN "members"."raw_donor_name" IS '봉투 원본 이름 (헌금 batch entry 매칭용)'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_9c6e24a77df888940bbf4394a5" ON "members" ("church_id", "lifecycle_stage") `);
    await queryRunner.query(`CREATE INDEX "IDX_9af22a5d6a55292ae0fd55e984" ON "members" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9af22a5d6a55292ae0fd55e984"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9c6e24a77df888940bbf4394a5"`);
    await queryRunner.query(`DROP TABLE "members"`);
    await queryRunner.query(`DROP TYPE "public"."members_lifecycle_stage_enum"`);
  }
}
