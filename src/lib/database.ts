import knexModule, { Knex } from "knex";

// Node and Vitest don't agree on how to import Knex -_-
const { knex } =
  process.env.NODE_ENV === "test" ? await import("knex") : knexModule;

const dbConnection: Knex.Config = {
  client: process.env.DB_CLIENT,
  connection: process.env.DB_URI,
};

export const database = knex(dbConnection);
