import knex from "knex";

const dbConnection: knex.Knex.Config = {
  client: process.env.DB_CLIENT,
  connection: process.env.DB_URI,
};

export const database = knex.knex(dbConnection);
