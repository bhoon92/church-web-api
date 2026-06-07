import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendance1780840378565 implements MigrationInterface {
  name = 'AddAttendance1780840378565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "worship_service" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b0c7ce6c7c32d47409458cce2cf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6541a1bd67d1141c948fb5a979" ON "worship_service" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_3def9e835fb29773a77ea9c972" ON "worship_service" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "attendance" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "worship_service_id" integer NOT NULL, "member_id" integer NOT NULL, "date" date NOT NULL, CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_5bd097d27f38e5a6cb0d08153e" ON "attendance" ("worship_service_id", "member_id", "date") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_52d9db0d044b7bcc372147cf5e" ON "attendance" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_156c1d7491e52afd0e5f0ddb36" ON "attendance" ("church_id", "worship_service_id", "date") `);
    await queryRunner.query(`CREATE INDEX "IDX_e602fa4565b0cc419e652d4ab0" ON "attendance" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_e602fa4565b0cc419e652d4ab0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_156c1d7491e52afd0e5f0ddb36"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_52d9db0d044b7bcc372147cf5e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5bd097d27f38e5a6cb0d08153e"`);
    await queryRunner.query(`DROP TABLE "attendance"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3def9e835fb29773a77ea9c972"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6541a1bd67d1141c948fb5a979"`);
    await queryRunner.query(`DROP TABLE "worship_service"`);
  }
}
