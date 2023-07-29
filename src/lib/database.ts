import { knex, Knex } from "knex";

const dbConnection: Knex.Config = {
  client: process.env.DB_CLIENT,
  connection: process.env.DB_URI,
};

export const database = knex(dbConnection);
