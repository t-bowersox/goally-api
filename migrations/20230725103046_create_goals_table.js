/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("goals", (table) => {
    table.increments("id");
    table.integer("user_id").unsigned().notNullable();
    table.text("description").notNullable();
    table.boolean("accomplished").defaultTo(false);
    table.timestamps(true, true);
    table.foreign("user_id").references("users.id").onDelete("cascade");
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTable("goals");
}
