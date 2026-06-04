import { timescaleSchemaSql } from "../../src/timescaleSchema.js";

export const config = { runtime: "edge" };

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=300, stale-while-revalidate=3600",
};

export default function handler(_request: Request) {
  return new Response(JSON.stringify({
    dialect: "postgresql-timescaledb",
    schema: "temporal",
    sql: timescaleSchemaSql,
  }), { headers });
}

