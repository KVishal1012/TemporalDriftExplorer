import { cityProfiles, layerObservations, type CityKey } from "../../../src/data.js";
import { getCitySourceReadiness } from "../../../src/providers.js";
import { readTimescaleLayerObservations } from "../../../src/server/timescale.js";

type VercelRequest = { url?: string };
type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  json: (body: unknown) => void;
};

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "s-maxage=300, stale-while-revalidate=3600",
};

const sendJson = (response: VercelResponse, status: number, body: unknown) => {
  response.setHeader("content-type", headers["content-type"]);
  response.setHeader("cache-control", headers["cache-control"]);
  response.status(status).json(body);
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const segments = new URL(request.url ?? "", "https://temporal.local").pathname.split("/");
  const cityId = segments[segments.length - 2] as CityKey;
  const profile = cityProfiles[cityId];

  if (!profile) {
    sendJson(response, 404, {
      error: "unsupported_city",
      message: "Temporal Drift Explorer currently supports Toronto and Chennai only.",
      supportedCities: Object.keys(cityProfiles),
    });
    return;
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

  sendJson(response, 200, {
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
  });
}
