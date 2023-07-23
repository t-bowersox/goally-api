import "dotenv/config";
import "process";

// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const envDefault = {
  client: process.env.DB_CLIENT,
  connection: {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  },
  migrations: {
    tableName: "knex_migrations",
  },
};

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {
  development: {
    ...envDefault,
  },

  production: {
    ...envDefault,
    pool: {
      min: 2,
      max: 10,
    },
  },
};
