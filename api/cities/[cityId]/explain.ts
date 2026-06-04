import { cityProfiles, type CityKey } from "../../../src/data.js";
import { buildAlphaEarthExtractionPlan, getCitySourceReadiness } from "../../../src/providers.js";

export const config = { runtime: "edge" };

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=120, stale-while-revalidate=600",
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

  const sourceReadiness = getCitySourceReadiness(cityId);

  return new Response(JSON.stringify({
    mode: "retrieval-shaped-seeded-response",
    cityId,
    corridor: profile.corridor,
    comparison: { startYear: 2012, endYear: 2018 },
    question: profile.question,
    findings: profile.findings,
    evidence: profile.evidence,
    sourceReadiness,
    alphaEarthPlan: buildAlphaEarthExtractionPlan(cityId),
    guardrail: "LLM answers must cite evidence from sourceReadiness, AlphaEarth summaries, or Timescale rows before replacing this seeded response.",
  }), { headers });
}

