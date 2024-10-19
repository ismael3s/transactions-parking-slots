import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialTable1729342822982 implements MigrationInterface {
  name = 'InitialTable1729342822982';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "parking_slot_reservation" ("id" character varying NOT NULL, "plate" character varying NOT NULL, "parking_slot_id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "left_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_eafe8670d76be10ee6c35f51c0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b38baa7ba8ce8de3c8dbeda8a4" ON "parking_slot_reservation" ("plate") `,
    );
    await queryRunner.query(
      `CREATE TABLE "parking_slot" ("id" character varying NOT NULL, "code" character varying(50) NOT NULL, "is_occupied" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_386d2ff6bfec65f872ef4b9d62f" UNIQUE ("code"), CONSTRAINT "PK_e95575350468d6e392985b2bffb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox" ("id" character varying NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE, "payload" jsonb NOT NULL, "event" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "parking_slot_reservation" ADD CONSTRAINT "FK_95ed6f7c50d11561c41ed83858f" FOREIGN KEY ("parking_slot_id") REFERENCES "parking_slot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
            INSERT INTO parking_slot (id, code, is_occupied, created_at)
            VALUES ('7b60fb62-222d-4d92-9a58-c33f94235301', 'A1', false, now()),
                     ('7b60fb62-222d-4d92-9a58-c33f94235302', 'A2', false, now()),
                     ('7b60fb62-222d-4d92-9a58-c33f9423533', 'A3', false, now()),
                     ('7b60fb62-222d-4d92-9a58-c33f94235306', 'A4', false, now());
            `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "parking_slot_reservation" DROP CONSTRAINT "FK_95ed6f7c50d11561c41ed83858f"`,
    );
    await queryRunner.query(`DROP TABLE "outbox"`);
    await queryRunner.query(`DROP TABLE "parking_slot"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b38baa7ba8ce8de3c8dbeda8a4"`,
    );
    await queryRunner.query(`DROP TABLE "parking_slot_reservation"`);
  }
}
