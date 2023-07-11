import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNameTable1689079801239 implements MigrationInterface {
    name = 'CreateNameTable1689079801239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "guardian" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "registrationNumber" character varying NOT NULL, "displayName" character varying, "description" character varying, "address" character varying, "city" character varying, "state" character varying, "zip" character varying, "country" character varying, "email" character varying, "phonenumber" integer, "website" character varying, "identityCommitment" character varying, "isApproved" boolean NOT NULL DEFAULT false, "hash" character varying, "walletAddress" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_9675166b4cdd0dd0adbb612ab74" UNIQUE ("registrationNumber"), CONSTRAINT "UQ_49e928e8c50cb738ef30d29e19f" UNIQUE ("email"), CONSTRAINT "PK_5eb51ec9378bc6b07702717160e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8cc68bb0db2e4654e0d805e938" ON "guardian" ("website") `);
        await queryRunner.query(`CREATE INDEX "IDX_dcf2c6f992f1d8dd29a5a62b6b" ON "guardian" ("identityCommitment") `);
        await queryRunner.query(`CREATE INDEX "IDX_357d6d62bf5456ac8d570b2ac6" ON "guardian" ("hash") `);
        await queryRunner.query(`CREATE INDEX "IDX_2527ff4e5dad1bf475513c9d91" ON "guardian" ("walletAddress") `);
        await queryRunner.query(`ALTER TABLE "user" ADD "walletAddress" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_efbd1135797e451d834bcf88cd" ON "user" ("walletAddress") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_efbd1135797e451d834bcf88cd"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "walletAddress"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2527ff4e5dad1bf475513c9d91"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_357d6d62bf5456ac8d570b2ac6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dcf2c6f992f1d8dd29a5a62b6b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8cc68bb0db2e4654e0d805e938"`);
        await queryRunner.query(`DROP TABLE "guardian"`);
    }

}
