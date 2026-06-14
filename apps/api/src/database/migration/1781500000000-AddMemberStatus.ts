import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 성도 재적상태를 enum(lifecycle_stage)에서 교회별 편집 가능한 reference(member_status)로 전환.
 * - member_status 테이블 생성 + 교회별 기본값 시드.
 * - member.status_id 추가 후 기존 lifecycle_stage 값으로 백필 → NOT NULL.
 * - lifecycle_stage enum 컬럼은 롤백 안전을 위해 남겨둠(미사용).
 */
export class AddMemberStatus1781500000000 implements MigrationInterface {
  name = 'AddMemberStatus1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "member_status" (` +
        `"created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), ` +
        `"deleted_at" TIMESTAMP WITH TIME ZONE, ` +
        `"id" SERIAL NOT NULL, ` +
        `"church_id" integer NOT NULL, ` +
        `"name" character varying NOT NULL, ` +
        `"sort_order" smallint NOT NULL DEFAULT '0', ` +
        `"is_active" boolean NOT NULL DEFAULT true, ` +
        `"system_key" character varying, ` +
        `"counts_in_roster" boolean NOT NULL DEFAULT true, ` +
        `CONSTRAINT "PK_member_status" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_member_status_church" ON "member_status" ("church_id")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_member_status_church_name" ON "member_status" ("church_id", "name") WHERE deleted_at IS NULL`
    );

    // 교회별 기본 재적상태 시드
    await queryRunner.query(
      `INSERT INTO "member_status" ("church_id", "name", "sort_order", "system_key", "counts_in_roster", "is_active") ` +
        `SELECT c.id, d.name, d.sort_order, d.system_key, d.counts_in_roster, d.is_active ` +
        `FROM "church" c CROSS JOIN (VALUES ` +
        `('방문', 0, NULL::varchar, true, true), ` +
        `('새가족', 1, 'new', true, true), ` +
        `('정식', 2, NULL, true, true), ` +
        `('이명', 3, NULL, false, true), ` +
        `('별세', 4, NULL, false, true), ` +
        `('장기결석', 5, NULL, true, true), ` +
        `('익명', 6, 'anonymous', false, false)` +
        `) AS d(name, sort_order, system_key, counts_in_roster, is_active)`
    );

    // member.status_id 추가 → lifecycle_stage 값으로 백필 → NOT NULL
    await queryRunner.query(`ALTER TABLE "member" ADD "status_id" integer`);
    await queryRunner.query(
      `UPDATE "member" m SET "status_id" = s.id FROM "member_status" s ` +
        `WHERE s.church_id = m.church_id AND s.name = CASE m.lifecycle_stage ` +
        `WHEN 'visitor' THEN '방문' WHEN 'new' THEN '새가족' WHEN 'regular' THEN '정식' ` +
        `WHEN 'transferred' THEN '이명' WHEN 'deceased' THEN '별세' WHEN 'absent' THEN '장기결석' ` +
        `WHEN 'anonymous' THEN '익명' END`
    );
    await queryRunner.query(`ALTER TABLE "member" ALTER COLUMN "status_id" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_member_status_id" ON "member" ("status_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_member_status_id"`);
    await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "status_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_member_status_church_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_member_status_church"`);
    await queryRunner.query(`DROP TABLE "member_status"`);
  }
}
