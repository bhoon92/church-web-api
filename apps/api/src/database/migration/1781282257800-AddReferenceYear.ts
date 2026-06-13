import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferenceYear1781282257800 implements MigrationInterface {
  name = 'AddReferenceYear1781282257800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_adfb249a41de2a114b9360ef14"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_879d5b089cbe578d1237ada9e9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f8a8063e77a6bba7382d6c9799"`);
    // 기존 행은 연도가 없으므로 nullable 추가 → 현재 연도(2026) 백필 → NOT NULL 승격
    await queryRunner.query(`ALTER TABLE "small_group" ADD "year" smallint`);
    await queryRunner.query(`UPDATE "small_group" SET "year" = 2026 WHERE "year" IS NULL`);
    await queryRunner.query(`ALTER TABLE "small_group" ALTER COLUMN "year" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "small_group"."year" IS '편성 연도'`);
    await queryRunner.query(`ALTER TABLE "ministry" ADD "year" smallint`);
    await queryRunner.query(`UPDATE "ministry" SET "year" = 2026 WHERE "year" IS NULL`);
    await queryRunner.query(`ALTER TABLE "ministry" ALTER COLUMN "year" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "ministry"."year" IS '편성 연도'`);
    await queryRunner.query(`ALTER TABLE "department" ADD "year" smallint`);
    await queryRunner.query(`UPDATE "department" SET "year" = 2026 WHERE "year" IS NULL`);
    await queryRunner.query(`ALTER TABLE "department" ALTER COLUMN "year" SET NOT NULL`);
    await queryRunner.query(`COMMENT ON COLUMN "department"."year" IS '편성 연도'`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ab72ce66e42c15aa95436162aa" ON "small_group" ("church_id", "year", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_9dae350bfef898134f6560e524" ON "small_group" ("church_id", "year") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_100cf5476adb07a74664a23fcb" ON "ministry" ("church_id", "year", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_2c074f15fae07009700a608759" ON "ministry" ("church_id", "year") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_4e1e00193ced02a60acef31e39" ON "department" ("church_id", "year", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_3a0233420031eae22e6b10a236" ON "department" ("church_id", "year") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_3a0233420031eae22e6b10a236"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4e1e00193ced02a60acef31e39"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2c074f15fae07009700a608759"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_100cf5476adb07a74664a23fcb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9dae350bfef898134f6560e524"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ab72ce66e42c15aa95436162aa"`);
    await queryRunner.query(`COMMENT ON COLUMN "department"."year" IS '편성 연도'`);
    await queryRunner.query(`ALTER TABLE "department" DROP COLUMN "year"`);
    await queryRunner.query(`COMMENT ON COLUMN "ministry"."year" IS '편성 연도'`);
    await queryRunner.query(`ALTER TABLE "ministry" DROP COLUMN "year"`);
    await queryRunner.query(`COMMENT ON COLUMN "small_group"."year" IS '편성 연도'`);
    await queryRunner.query(`ALTER TABLE "small_group" DROP COLUMN "year"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_f8a8063e77a6bba7382d6c9799" ON "department" ("church_id", "name") WHERE (deleted_at IS NULL)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_879d5b089cbe578d1237ada9e9" ON "ministry" ("church_id", "name") WHERE (deleted_at IS NULL)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_adfb249a41de2a114b9360ef14" ON "small_group" ("church_id", "name") WHERE (deleted_at IS NULL)`
    );
  }
}
