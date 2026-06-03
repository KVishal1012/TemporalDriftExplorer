import { cityProfiles } from "../src/data.js";

export const config = { runtime: "edge" };

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=300, stale-while-revalidate=3600",
};

export default function handler(_request: Request) {
  const cities = Object.values(cityProfiles).map((profile) => ({
    id: profile.id,
    city: profile.city,
    country: profile.country,
    countryCode: profile.countryCode,
    corridor: profile.corridor,
  }));

  return new Response(JSON.stringify({ markets: ["Canada", "India"], cities }), { headers });
}
