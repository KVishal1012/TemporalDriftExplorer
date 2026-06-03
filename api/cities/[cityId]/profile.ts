import { cityProfiles, type CityKey } from "../../../src/data";

export const config = { runtime: "edge" };

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=300, stale-while-revalidate=3600",
};

export default function handler(request: Request) {
  const segments = new URL(request.url).pathname.split("/");
  const cityId = segments[segments.length - 2] as CityKey;
  const profile = cityProfiles[cityId];

  if (!profile) {
    return new Response(JSON.stringify({
      error: "unsupported_city",
      message: "Temporal Drift Explorer currently supports Toronto and Chennai only.",
      supportedCities: Object.keys(cityProfiles),
    }), { status: 404, headers });
  }

  return new Response(JSON.stringify({ profile }), { headers });
}
