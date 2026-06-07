import { cityProfiles, layerObservations, type CityKey } from "../../../src/data.js";
import { getCitySourceReadiness } from "../../../src/providers.js";
import { readTimescaleLayerObservations } from "../../../src/server/timescale.js";

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=300, stale-while-revalidate=3600",
};

export default async function handler(request: Request) {
  const segments = new URL(request.url, "https://temporal.local").pathname.split("/");
  const cityId = segments[segments.length - 2] as CityKey;
  const profile = cityProfiles[cityId];

  if (!profile) {
    return new Response(JSON.stringify({
      error: "unsupported_city",
      message: "Temporal Drift Explorer currently supports Toronto and Chennai only.",
      supportedCities: Object.keys(cityProfiles),
    }), { status: 404, headers });
  }

  const readiness = getCitySourceReadiness(cityId);
  let liveObservations = readiness.loadedSourceObservations;
  let readMode = "seeded-fallback";
  let databaseError: string | null = null;

  try {
    const timescaleObservations = await readTimescaleLayerObservations(cityId);
    if (timescaleObservations.length > 0) {
      liveObservations = timescaleObservations;
      readMode = "timescale-live";
    }
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "Timescale read failed.";
  }

  return new Response(JSON.stringify({
    cityId,
    corridor: profile.corridor,
    sources: profile.sources,
    observations: liveObservations.length > 0 ? liveObservations : layerObservations.filter((observation) => observation.cityId === cityId),
    loadedSourceObservations: liveObservations,
    fallbackObservations: readiness.fallbackObservations,
    liveRowsLoaded: liveObservations.length,
    civicDatasets: readiness.civicDatasets.map((dataset) => ({
      ...dataset,
      loadedRows: dataset.layer === "zoning" ? liveObservations.length : dataset.loadedRows,
    })),
    ingestionTargets: readiness.ingestionTargets,
    readMode,
    databaseError,
  }), { headers });
}
