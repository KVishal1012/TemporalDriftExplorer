import { civicDatasetContracts, cityProfiles, type CityKey } from "../../../src/data.js";
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

  const datasets = civicDatasetContracts.filter((dataset) => dataset.cityId === cityId);
  let liveRowsLoaded = 0;
  let databaseError: string | null = null;

  try {
    liveRowsLoaded = (await readTimescaleLayerObservations(cityId)).length;
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "Timescale read failed.";
  }

  sendJson(response, 200, {
    cityId,
    corridor: profile.corridor,
    datasets: datasets.map((dataset) => ({
      ...dataset,
      loadedRows: dataset.layer === "zoning" ? liveRowsLoaded : dataset.loadedRows,
    })),
    loadedRows: liveRowsLoaded,
    readMode: liveRowsLoaded > 0 ? "timescale-live" : "source-contract-only",
    databaseError,
    guardrail: "Dataset contracts can reference official sources before ingestion, but loadedRows must stay 0 until real rows are fetched, corridor-filtered server-side, and written to TimescaleDB.",
  });
}
