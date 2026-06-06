import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1780742622330 implements MigrationInterface {
  name = 'Initial1780742622330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."churches_status_enum" AS ENUM('active', 'trial', 'suspended')`);
    await queryRunner.query(
      `CREATE TABLE "churches" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying, "registration_number" character varying, "representative" character varying, "address" character varying, "phone" character varying, "logo_url" character varying, "fiscal_year_start_month" smallint NOT NULL DEFAULT '1', "status" "public"."churches_status_enum" NOT NULL DEFAULT 'trial', CONSTRAINT "PK_6048a6f37c897751d61cbb0347a" PRIMARY KEY ("id")); COMMENT ON COLUMN "churches"."slug" IS '교회 url slug — 추후 도메인/링크 등에 사용'; COMMENT ON COLUMN "churches"."registration_number" IS '사업자등록번호 / 고유번호 — 영수증 발급 주체'; COMMENT ON COLUMN "churches"."representative" IS '대표자(담임목사)'; COMMENT ON COLUMN "churches"."logo_url" IS '로고 storage key'; COMMENT ON COLUMN "churches"."fiscal_year_start_month" IS '기본 회계연도 시작월 (1-12)'`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2be0a30228cd98adde1ab52f4f" ON "churches" ("slug") WHERE deleted_at IS NULL`);
    await queryRunner.query(
      `CREATE TABLE "accounts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "google_id" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "picture_url" character varying, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id")); COMMENT ON COLUMN "accounts"."google_id" IS 'Google sub'; COMMENT ON COLUMN "accounts"."picture_url" IS 'Google profile picture URL'`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2432886a32fc3dc085583f7e44" ON "accounts" ("email") WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_51d013b5b6881363877a23f92d" ON "accounts" ("google_id") WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE TYPE "public"."memberships_role_enum" AS ENUM('owner', 'admin', 'staff', 'viewer')`);
    await queryRunner.query(
      `CREATE TABLE "memberships" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "account_id" integer NOT NULL, "church_id" integer NOT NULL, "role" "public"."memberships_role_enum" NOT NULL DEFAULT 'staff', "member_id" integer, CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_83a94afc7629fa3019747c7cf3" ON "memberships" ("church_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d8f9f300d181189a0775b2d971" ON "memberships" ("account_id", "church_id") WHERE deleted_at IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_d8f9f300d181189a0775b2d971"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_83a94afc7629fa3019747c7cf3"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(`DROP TYPE "public"."memberships_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_51d013b5b6881363877a23f92d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2432886a32fc3dc085583f7e44"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2be0a30228cd98adde1ab52f4f"`);
    await queryRunner.query(`DROP TABLE "churches"`);
    await queryRunner.query(`DROP TYPE "public"."churches_status_enum"`);
  }
}
