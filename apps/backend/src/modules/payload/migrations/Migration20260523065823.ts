import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260523065823 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "payload_integration_settings" ("id" text not null, "api_key" text not null, "user_collection" text not null default 'users', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payload_integration_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payload_integration_settings_deleted_at" ON "payload_integration_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payload_integration_settings" cascade;`);
  }

}
