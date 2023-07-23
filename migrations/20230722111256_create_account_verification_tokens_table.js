/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable("account_verification_tokens", (table) => {
    table.increments("id");
    table.integer("user_id").unsigned().unique().notNullable();
    table.string("token", 255).notNullable();
    table.timestamps(true, true);
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("cascade");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTable("account_verification_tokens");
}
