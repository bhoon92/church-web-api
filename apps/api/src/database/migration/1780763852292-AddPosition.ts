import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosition1780763852292 implements MigrationInterface {
  name = 'AddPosition1780763852292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "positions" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_17e4e62ccd5749b289ae3fae6f3" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_31f73c2a5eb75a35840ded26f6" ON "positions" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_9213292d3190cd4ba7a08de017" ON "positions" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "member_positions" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "position_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date, "note" text, CONSTRAINT "PK_287393936843ac8c2864608040a" PRIMARY KEY ("id")); COMMENT ON COLUMN "member_positions"."note" IS '비고 (취임 경위 등)'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cd69b401d68131a0b8e5594187" ON "member_positions" ("member_id") WHERE end_date IS NULL AND deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_0bf0052467af1c080ffbd9ea48" ON "member_positions" ("position_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_4dcaeb0e3e0a3143a1d5aec092" ON "member_positions" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_00dfd4b20a66aaea07974c35b8" ON "member_positions" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_00dfd4b20a66aaea07974c35b8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4dcaeb0e3e0a3143a1d5aec092"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0bf0052467af1c080ffbd9ea48"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cd69b401d68131a0b8e5594187"`);
    await queryRunner.query(`DROP TABLE "member_positions"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9213292d3190cd4ba7a08de017"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_31f73c2a5eb75a35840ded26f6"`);
    await queryRunner.query(`DROP TABLE "positions"`);
  }
}
