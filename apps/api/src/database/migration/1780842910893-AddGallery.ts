import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGallery1780842910893 implements MigrationInterface {
  name = 'AddGallery1780842910893';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "photo" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "event_id" integer NOT NULL, "s3_key" character varying NOT NULL, "original_name" character varying NOT NULL, "content_type" character varying, "size" bigint, "uploader_account_id" integer NOT NULL, "sort_order" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_723fa50bf70dcfd06fb5a44d4ff" PRIMARY KEY ("id")); COMMENT ON COLUMN "photo"."s3_key" IS 'S3 object key'; COMMENT ON COLUMN "photo"."uploader_account_id" IS '업로더 account'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_a5cae8ab915b11dee0d8742579" ON "photo" ("event_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_fad98c4a6b07b7266e1aef89b0" ON "photo" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "event" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "date" date, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "IDX_9ee5168db086bf2c7636d709e4" ON "event" ("church_id", "date") `);
    await queryRunner.query(`CREATE INDEX "IDX_46ea4ba7bda7eea7591e10f961" ON "event" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_46ea4ba7bda7eea7591e10f961"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9ee5168db086bf2c7636d709e4"`);
    await queryRunner.query(`DROP TABLE "event"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fad98c4a6b07b7266e1aef89b0"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a5cae8ab915b11dee0d8742579"`);
    await queryRunner.query(`DROP TABLE "photo"`);
  }
}
