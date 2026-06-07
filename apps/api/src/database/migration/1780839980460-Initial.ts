import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1780839980460 implements MigrationInterface {
  name = 'Initial1780839980460';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "small_group" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_89e27afcc0cc5198a7a1e0bdf10" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_adfb249a41de2a114b9360ef14" ON "small_group" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_3a69c23f4d87244acc81885e9a" ON "small_group" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "position" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b7f483581562b4dc62ae1a5b7e2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_399b28a05a69b198a6b02474de" ON "position" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_50d6ba97b246ca8ffb14b5c0cd" ON "position" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "ministry" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_9279166bcd571de7497c6c667a4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_879d5b089cbe578d1237ada9e9" ON "ministry" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_35c9c8f09f9ef9854bd911ea7a" ON "ministry" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "member_ministry" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "ministry_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_leader" boolean NOT NULL DEFAULT false, "role_label" character varying, CONSTRAINT "PK_5f0afc141b59724bb6d5962206d" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_ministry"."role_label" IS '리더 호칭 (팀장/부팀장 등 free-form)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f733d0060bc92093bb9fae710e" ON "member_ministry" ("member_id", "ministry_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_8ab5bc4b4456333128368a2fc4" ON "member_ministry" ("ministry_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_0fd61dc8c09833318fcecab6ca" ON "member_ministry" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_3b35f2e2583fa02e120727f416" ON "member_ministry" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "member_small_group" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "small_group_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_leader" boolean NOT NULL DEFAULT false, "role_label" character varying, CONSTRAINT "PK_b6e7679c39acd17cbe02d5180d3" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_small_group"."role_label" IS '리더 호칭 (목자/구역장 등 free-form)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8e0e69b3f0fd7d9bd94d86efe4" ON "member_small_group" ("member_id", "small_group_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_4baeaacd274da9360c0fdfd730" ON "member_small_group" ("small_group_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_2919540daaf3f08f060495ca47" ON "member_small_group" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_f0b1528fcfec4109a6ca08841e" ON "member_small_group" ("church_id") `);
    await queryRunner.query(`CREATE TYPE "public"."membership_role_enum" AS ENUM('owner', 'admin', 'staff', 'viewer')`);
    await queryRunner.query(
      `CREATE TABLE "membership" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "account_id" integer NOT NULL, "church_id" integer NOT NULL, "role" "public"."membership_role_enum" NOT NULL DEFAULT 'staff', "member_id" integer, CONSTRAINT "PK_83c1afebef3059472e7c37e8de8" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_4f57ae178a5c02ed6759f77c29" ON "membership" ("church_id") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9efe3a793286dd540af2d03cb8" ON "membership" ("account_id", "church_id") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."member_lifecycle_stage_enum" AS ENUM('visitor', 'new', 'regular', 'transferred', 'deceased', 'absent', 'anonymous')`
    );
    await queryRunner.query(
      `CREATE TABLE "member" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "phone" character varying, "birth" date, "lifecycle_stage" "public"."member_lifecycle_stage_enum" NOT NULL DEFAULT 'visitor', "note" text, "registered_at" date, "baptized_at" date, "confirmed_at" date, "previous_church" character varying, "faith_years" smallint, "registration_reason" text, "occupation" character varying, "address" character varying, "raw_donor_name" character varying, CONSTRAINT "PK_97cbbe986ce9d14ca5894fdc072" PRIMARY KEY ("id")); COMMENT ON COLUMN "member"."note" IS '비고/노트'; COMMENT ON COLUMN "member"."registered_at" IS '정식 등록일'; COMMENT ON COLUMN "member"."baptized_at" IS '세례일'; COMMENT ON COLUMN "member"."confirmed_at" IS '입교일'; COMMENT ON COLUMN "member"."previous_church" IS '이전 교회'; COMMENT ON COLUMN "member"."faith_years" IS '신앙 경력 (년)'; COMMENT ON COLUMN "member"."registration_reason" IS '등록 동기'; COMMENT ON COLUMN "member"."occupation" IS '직업'; COMMENT ON COLUMN "member"."address" IS '주소'; COMMENT ON COLUMN "member"."raw_donor_name" IS '봉투 원본 이름 (헌금 batch entry 매칭용)'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_82356c736fa68d83f0d50682dd" ON "member" ("church_id", "lifecycle_stage") `);
    await queryRunner.query(`CREATE INDEX "IDX_6d4f59ac9343c38e9d18c512f7" ON "member" ("church_id") `);
    await queryRunner.query(`CREATE TYPE "public"."church_status_enum" AS ENUM('active', 'trial', 'suspended')`);
    await queryRunner.query(
      `CREATE TABLE "church" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "slug" character varying, "registration_number" character varying, "representative" character varying, "address" character varying, "phone" character varying, "logo_url" character varying, "fiscal_year_start_month" smallint NOT NULL DEFAULT '1', "status" "public"."church_status_enum" NOT NULL DEFAULT 'trial', CONSTRAINT "PK_b78b04d4dce07ba40672ef148ae" PRIMARY KEY ("id")); COMMENT ON COLUMN "church"."slug" IS '교회 url slug — 추후 도메인/링크 등에 사용'; COMMENT ON COLUMN "church"."registration_number" IS '사업자등록번호 / 고유번호 — 영수증 발급 주체'; COMMENT ON COLUMN "church"."representative" IS '대표자(담임목사)'; COMMENT ON COLUMN "church"."logo_url" IS '로고 storage key'; COMMENT ON COLUMN "church"."fiscal_year_start_month" IS '기본 회계연도 시작월 (1-12)'`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dfc7d24e5b093b11b4f8f556e7" ON "church" ("slug") WHERE deleted_at IS NULL`);
    await queryRunner.query(
      `CREATE TABLE "member_department" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "department_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_leader" boolean NOT NULL DEFAULT false, "role_label" character varying, CONSTRAINT "PK_1f3d79a59e133f44e94db8e10a6" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_department"."role_label" IS '리더 호칭 (부서장/부감/총무 등 free-form)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3289f0dcd6a1bb3450aba23ad6" ON "member_department" ("member_id", "department_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_c0f78a1ec9c6aa8ce617799edd" ON "member_department" ("department_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_899f32876d221ffe6e58124b35" ON "member_department" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_8521ba3d2a6c0e7e228670fb79" ON "member_department" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "account" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "google_id" character varying NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "picture_url" character varying, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id")); COMMENT ON COLUMN "account"."google_id" IS 'Google sub'; COMMENT ON COLUMN "account"."picture_url" IS 'Google profile picture URL'`
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aeeb0a66019f876e66dadf58cb" ON "account" ("email") WHERE deleted_at IS NULL`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8102f07aef2058f0e54bdfe5da" ON "account" ("google_id") WHERE deleted_at IS NULL`);
    await queryRunner.query(
      `CREATE TABLE "member_position" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "position_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "note" text, CONSTRAINT "PK_468d21997e6724b131ce1a9f9d9" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_position"."note" IS '비고 (취임 경위 등)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d1c4d396be8026ded8d1e5915e" ON "member_position" ("member_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_56bf8cdb3e3e11385e93f61971" ON "member_position" ("position_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_4b3e2863331d5523e85e9c0656" ON "member_position" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_0037dab95cf7bdfa9b959a6797" ON "member_position" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "department" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f8a8063e77a6bba7382d6c9799" ON "department" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_c3fbe32352100d6e4caea64e37" ON "department" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_c3fbe32352100d6e4caea64e37"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f8a8063e77a6bba7382d6c9799"`);
    await queryRunner.query(`DROP TABLE "department"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0037dab95cf7bdfa9b959a6797"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4b3e2863331d5523e85e9c0656"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_56bf8cdb3e3e11385e93f61971"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d1c4d396be8026ded8d1e5915e"`);
    await queryRunner.query(`DROP TABLE "member_position"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8102f07aef2058f0e54bdfe5da"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aeeb0a66019f876e66dadf58cb"`);
    await queryRunner.query(`DROP TABLE "account"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8521ba3d2a6c0e7e228670fb79"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_899f32876d221ffe6e58124b35"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c0f78a1ec9c6aa8ce617799edd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3289f0dcd6a1bb3450aba23ad6"`);
    await queryRunner.query(`DROP TABLE "member_department"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_dfc7d24e5b093b11b4f8f556e7"`);
    await queryRunner.query(`DROP TABLE "church"`);
    await queryRunner.query(`DROP TYPE "public"."church_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6d4f59ac9343c38e9d18c512f7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_82356c736fa68d83f0d50682dd"`);
    await queryRunner.query(`DROP TABLE "member"`);
    await queryRunner.query(`DROP TYPE "public"."member_lifecycle_stage_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9efe3a793286dd540af2d03cb8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4f57ae178a5c02ed6759f77c29"`);
    await queryRunner.query(`DROP TABLE "membership"`);
    await queryRunner.query(`DROP TYPE "public"."membership_role_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f0b1528fcfec4109a6ca08841e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2919540daaf3f08f060495ca47"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4baeaacd274da9360c0fdfd730"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8e0e69b3f0fd7d9bd94d86efe4"`);
    await queryRunner.query(`DROP TABLE "member_small_group"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3b35f2e2583fa02e120727f416"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0fd61dc8c09833318fcecab6ca"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8ab5bc4b4456333128368a2fc4"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f733d0060bc92093bb9fae710e"`);
    await queryRunner.query(`DROP TABLE "member_ministry"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_35c9c8f09f9ef9854bd911ea7a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_879d5b089cbe578d1237ada9e9"`);
    await queryRunner.query(`DROP TABLE "ministry"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_50d6ba97b246ca8ffb14b5c0cd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_399b28a05a69b198a6b02474de"`);
    await queryRunner.query(`DROP TABLE "position"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3a69c23f4d87244acc81885e9a"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_adfb249a41de2a114b9360ef14"`);
    await queryRunner.query(`DROP TABLE "small_group"`);
  }
}
