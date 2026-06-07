import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFinance1780840833609 implements MigrationInterface {
  name = 'AddFinance1780840833609';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "offering" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "member_id" integer NOT NULL, "offering_category_id" integer NOT NULL, "worship_service_id" integer, "amount" bigint NOT NULL, "date" date NOT NULL, "raw_donor_name" character varying, "note" text, "recorder_account_id" integer NOT NULL, CONSTRAINT "PK_d42d2720ff82f75aae518b9347c" PRIMARY KEY ("id")); COMMENT ON COLUMN "offering"."member_id" IS '헌금자 성도'; COMMENT ON COLUMN "offering"."worship_service_id" IS '연결된 예배 (선택)'; COMMENT ON COLUMN "offering"."raw_donor_name" IS '봉투 원본 이름'; COMMENT ON COLUMN "offering"."recorder_account_id" IS '입력자 account'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_102924999d7dc3f7abd481c4dc" ON "offering" ("offering_category_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_746c5c4d85cc9c950c78f60cc2" ON "offering" ("member_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_668406b2fa441070f4c5d884e9" ON "offering" ("church_id", "date") `);
    await queryRunner.query(`CREATE INDEX "IDX_0937e8f323a310427c9d6f956e" ON "offering" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "offering_category" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cda768a04fc2a0cb408d6ebce5f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7f424c6428ef0cb67f9396ab00" ON "offering_category" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_ddc954df715aab3045b5b6629d" ON "offering_category" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "fiscal_year" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "is_current" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_72fa5ea3e6b0ec7542c23bf0389" PRIMARY KEY ("id")); COMMENT ON COLUMN "fiscal_year"."name" IS '예: 2026 회계연도'`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_447d653e2d35c7d97da04a79e2" ON "fiscal_year" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_fa5b68ceecb7abec857a1ddc36" ON "fiscal_year" ("church_id") `);
    await queryRunner.query(`CREATE TYPE "public"."finance_transaction_flow_enum" AS ENUM('income', 'expense')`);
    await queryRunner.query(
      `CREATE TABLE "finance_transaction" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "fiscal_year_id" integer, "flow" "public"."finance_transaction_flow_enum" NOT NULL, "account_category_id" integer, "amount" bigint NOT NULL, "date" date NOT NULL, "title" character varying NOT NULL, "budget_allocation_id" integer, "note" text, "recorder_account_id" integer NOT NULL, CONSTRAINT "PK_2fb0ccf1341a200f665c0aa615d" PRIMARY KEY ("id")); COMMENT ON COLUMN "finance_transaction"."title" IS '적요/제목'; COMMENT ON COLUMN "finance_transaction"."budget_allocation_id" IS '지출 시 연결된 부서별 예산 (선택)'; COMMENT ON COLUMN "finance_transaction"."recorder_account_id" IS '입력자 account'`
    );
    await queryRunner.query(`CREATE INDEX "IDX_12271f337c4514c60a7886bdb3" ON "finance_transaction" ("budget_allocation_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_f453582fb24c022d3561f61e96" ON "finance_transaction" ("church_id", "fiscal_year_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_6b294cdf19ccbbc4769dfc45ab" ON "finance_transaction" ("church_id", "date") `);
    await queryRunner.query(`CREATE INDEX "IDX_7d7a6b8ae4cd43c6ae6639ab2b" ON "finance_transaction" ("church_id") `);
    await queryRunner.query(`CREATE TYPE "public"."budget_allocation_target_kind_enum" AS ENUM('department', 'ministry', 'small_group')`);
    await queryRunner.query(
      `CREATE TABLE "budget_allocation" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "fiscal_year_id" integer NOT NULL, "target_kind" "public"."budget_allocation_target_kind_enum" NOT NULL, "target_id" integer NOT NULL, "amount" bigint NOT NULL, "note" text, CONSTRAINT "PK_64e5d7615bc18728db857046e05" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ac1580335fdc88f005e5632c34" ON "budget_allocation" ("fiscal_year_id", "target_kind", "target_id") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_0b3fd2d0061e039d15f2dbfc29" ON "budget_allocation" ("church_id", "fiscal_year_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_9e77b4b017c74ec70e66a9bbc9" ON "budget_allocation" ("church_id") `);
    await queryRunner.query(
      `CREATE TABLE "account_category" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "id" SERIAL NOT NULL, "church_id" integer NOT NULL, "name" character varying NOT NULL, "description" text, "sort_order" smallint NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_534910c01c9eaf39f2df194114f" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d09de4b63e5aefeb1704964607" ON "account_category" ("church_id", "name") WHERE deleted_at IS NULL`
    );
    await queryRunner.query(`CREATE INDEX "IDX_0337e5a0b11c10181e18e7f95b" ON "account_category" ("church_id") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_0337e5a0b11c10181e18e7f95b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d09de4b63e5aefeb1704964607"`);
    await queryRunner.query(`DROP TABLE "account_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9e77b4b017c74ec70e66a9bbc9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0b3fd2d0061e039d15f2dbfc29"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ac1580335fdc88f005e5632c34"`);
    await queryRunner.query(`DROP TABLE "budget_allocation"`);
    await queryRunner.query(`DROP TYPE "public"."budget_allocation_target_kind_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7d7a6b8ae4cd43c6ae6639ab2b"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_6b294cdf19ccbbc4769dfc45ab"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_f453582fb24c022d3561f61e96"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_12271f337c4514c60a7886bdb3"`);
    await queryRunner.query(`DROP TABLE "finance_transaction"`);
    await queryRunner.query(`DROP TYPE "public"."finance_transaction_flow_enum"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fa5b68ceecb7abec857a1ddc36"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_447d653e2d35c7d97da04a79e2"`);
    await queryRunner.query(`DROP TABLE "fiscal_year"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ddc954df715aab3045b5b6629d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7f424c6428ef0cb67f9396ab00"`);
    await queryRunner.query(`DROP TABLE "offering_category"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0937e8f323a310427c9d6f956e"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_668406b2fa441070f4c5d884e9"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_746c5c4d85cc9c950c78f60cc2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_102924999d7dc3f7abd481c4dc"`);
    await queryRunner.query(`DROP TABLE "offering"`);
  }
}
