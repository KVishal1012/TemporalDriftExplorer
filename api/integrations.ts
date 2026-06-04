import { getIntegrationReadiness } from "../src/providers.js";

export const config = { runtime: "edge" };

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=120, stale-while-revalidate=600",
};

export default function handler(_request: Request) {
  return new Response(JSON.stringify({
    markets: ["Canada", "India"],
    integrations: getIntegrationReadiness(),
  }), { headers });
}

