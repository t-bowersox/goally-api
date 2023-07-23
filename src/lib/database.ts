import knex from "knex";

const dbConnection: knex.Knex.Config = {
  client: process.env.DB_CLIENT,
  connection: {
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT ?? "0"),
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  },
};

export const database = knex.knex(dbConnection);
