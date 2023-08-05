import knexModule, { Knex } from "knex";

// Node and Vitest don't agree on how to import Knex -_-
const { knex } =
  process.env.NODE_ENV === "test" ? await import("knex") : knexModule;

const dbConnection: Knex.Config = {
  client: process.env.DB_CLIENT,
  connection: process.env.DB_URI,
  pool: {
    min: Number.parseInt(process.env.DB_POOL_MIN ?? "2"),
    max: Number.parseInt(process.env.DB_POOL_MAX ?? "10"),
  },
};

export const database = knex(dbConnection);
