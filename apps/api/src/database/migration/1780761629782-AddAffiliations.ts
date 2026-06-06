import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAffiliations1780761629782 implements MigrationInterface {
  name = 'AddAffiliations1780761629782';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "small_groups" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b2edbdcb8c93e7319f198edc576" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a28d7c234692360e973dde96e0" ON "small_groups" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_0cc212ba0cb4a2c4f651527609" ON "small_groups" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "member_ministries" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "ministry_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_leader" boolean NOT NULL DEFAULT false, "role_label" character varying, CONSTRAINT "PK_cbddb99e4e6d37a0ac9e1940f46" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_ministries"."role_label" IS '리더 호칭 (팀장/부팀장 등 free-form)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9f3eaafdaae4dae245bc2669e4" ON "member_ministries" ("member_id", "ministry_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_76faed924fb3ea2e098f982062" ON "member_ministries" ("ministry_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_9cccfc734c4f95a3c64c4e9527" ON "member_ministries" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_cac5466cc7ca16c573094b5ebc" ON "member_ministries" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "member_departments" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "department_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_leader" boolean NOT NULL DEFAULT false, "role_label" character varying, CONSTRAINT "PK_e33a41b778acb5b2a1559d13411" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_departments"."role_label" IS '리더 호칭 (부서장/부감/총무 등 free-form)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_01b1b4879c8c5410d67c4391dc" ON "member_departments" ("member_id", "department_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_8994b9241764d1db1f5b56ebe9" ON "member_departments" ("department_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_e4c2baa13e8f1c5d23b3f6cde9" ON "member_departments" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_7edec415ac572caa50ced23ef8" ON "member_departments" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "member_small_groups" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "small_group_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "is_leader" boolean NOT NULL DEFAULT false, "role_label" character varying, CONSTRAINT "PK_46769626e110a7b7702a8ec7785" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_small_groups"."role_label" IS '리더 호칭 (목자/구역장 등 free-form)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_64dc79a6258fc9de581e5dbb44" ON "member_small_groups" ("member_id", "small_group_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_d9a1d7b720a52fd55a031bcd38" ON "member_small_groups" ("small_group_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_871b6ca1f405dd23a5355d283e" ON "member_small_groups" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_5935794010672fb4c88850a9af" ON "member_small_groups" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "departments" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a611010ab9f844420e2b6994a5" ON "departments" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_ebe85fc195ae07c01aa8cea127" ON "departments" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "ministries" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_ad897fa0432df1de62b552a8706" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_bdeeb7c3b7adcb9064364e0359" ON "ministries" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_0ecfba282a72e384bab878c1a6" ON "ministries" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0ecfba282a72e384bab878c1a6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bdeeb7c3b7adcb9064364e0359"`);
    await queryRunner.query(`DROP TABLE "ministries"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ebe85fc195ae07c01aa8cea127"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a611010ab9f844420e2b6994a5"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5935794010672fb4c88850a9af"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_871b6ca1f405dd23a5355d283e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d9a1d7b720a52fd55a031bcd38"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_64dc79a6258fc9de581e5dbb44"`);
    await queryRunner.query(`DROP TABLE "member_small_groups"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7edec415ac572caa50ced23ef8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e4c2baa13e8f1c5d23b3f6cde9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_8994b9241764d1db1f5b56ebe9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01b1b4879c8c5410d67c4391dc"`);
    await queryRunner.query(`DROP TABLE "member_departments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cac5466cc7ca16c573094b5ebc"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9cccfc734c4f95a3c64c4e9527"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_76faed924fb3ea2e098f982062"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9f3eaafdaae4dae245bc2669e4"`);
    await queryRunner.query(`DROP TABLE "member_ministries"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0cc212ba0cb4a2c4f651527609"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a28d7c234692360e973dde96e0"`);
    await queryRunner.query(`DROP TABLE "small_groups"`);
  }
}
