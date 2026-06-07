import { readFileSync } from "node:fs";

const data = readFileSync("src/data.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const readme = readFileSync("README.md", "utf8");
const mapCanvas = readFileSync("src/MapCanvas.tsx", "utf8");
const providers = readFileSync("src/providers.ts", "utf8");
const schema = readFileSync("db/timescale_schema.sql", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const datasetApi = readFileSync("api/cities/[cityId]/datasets.ts", "utf8");
const layersApi = readFileSync("api/cities/[cityId]/layers.ts", "utf8");
const ingestionApi = readFileSync("api/ingest/toronto/zoning.ts", "utf8");
const timescaleServer = readFileSync("src/server/timescale.ts", "utf8");
const torontoIngestion = readFileSync("src/server/torontoZoningIngestion.ts", "utf8");

const required = [
  ["Toronto profile", data.includes('city: "Toronto"')],
  ["Chennai profile", data.includes('city: "Chennai"')],
  ["Canada market", data.includes('country: "Canada"')],
  ["India market", data.includes('country: "India"')],
  ["City switcher", app.includes("selectCity")],
  ["Market badge", app.includes("Canada + India only")],
  ["Google Maps env key", mapCanvas.includes("VITE_GOOGLE_MAPS_API_KEY")],
  ["Google Maps map surface", mapCanvas.includes("google.maps.Map")],
  ["Dynamic corridor projection", mapCanvas.includes("getProjectionDomain") && mapCanvas.includes("toSvgPolygon") && !mapCanvas.includes("fallbackCorridorPath")],
  ["No live/fallback overlay stacking", mapCanvas.includes("showFallbackOverlays") && mapCanvas.includes('loadState !== "ready"')],
  ["Full timeline simulation labels", app.includes("baselineYear") && app.includes("Run Simulation") && !app.includes("<b>2012</b>")],
  ["Data truth status UI", app.includes("Data status") && app.includes("loaded live civic rows") && app.includes("source contracts")],
  ["Seeded zoning guardrail", data.includes("truthLabels") && data.includes('provenance: "seeded-fallback" as const')],
  ["Toronto zoning source contract", data.includes("toronto-zoning-by-law") && data.includes("loadedRows: 0") && data.includes("d75fa1ed-cd04-4a0b-bb6d-2b928ffffa6e")],
  ["Dataset contract endpoint", datasetApi.includes("civicDatasetContracts") && datasetApi.includes("readTimescaleLayerObservations") && datasetApi.includes("guardrail")],
  ["Timescale layer read path", layersApi.includes("readTimescaleLayerObservations") && layersApi.includes("timescale-live")],
  ["Token-gated Toronto zoning ingestion endpoint", ingestionApi.includes("INGEST_API_TOKEN") && ingestionApi.includes("ingestTorontoZoning")],
  ["Timescale server helper", timescaleServer.includes("pg") && timescaleServer.includes("ensureTimescaleSchema") && timescaleServer.includes("readTimescaleLayerObservations")],
  ["Toronto CKAN zoning ingestion", torontoIngestion.includes("package_show?id=zoning-by-law") && torontoIngestion.includes("ZN_ZONE") && torontoIngestion.includes("live-civic-data")],
  ["AlphaEarth dataset", data.includes("GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")],
  ["AlphaEarth attribution", data.includes("The AlphaEarth Foundations Satellite Embedding dataset is produced by Google and Google DeepMind.")],
  ["AlphaEarth extraction plan", providers.includes("buildAlphaEarthExtractionPlan")],
  ["Timescale schema", schema.includes("create_hypertable") && schema.includes("temporal.alphaearth_embeddings") && schema.includes("dataset_id")],
  ["Server-only ingestion env", envExample.includes("INGEST_API_TOKEN") && envExample.includes("TORONTO_ZONING_MAX_FEATURES")],
  ["Server-only AlphaEarth env", envExample.includes("EARTH_ENGINE_SERVICE_ACCOUNT") && envExample.includes("GOOGLE_APPLICATION_CREDENTIALS_JSON")],
  ["Source readiness endpoint docs", readme.includes("/api/cities/toronto/sources") && readme.includes("/api/cities/toronto/datasets") && readme.includes("/api/ingest/toronto/zoning") && readme.includes("/api/integrations")],
  ["No primary synthetic image map", !app.includes("profile.asset") && !app.includes("<img className=\"map-image\"")],
  ["README launch markets", readme.includes("Launch Markets")],
];

const forbidden = ["Detroit", "Woodward", "detroit-corridor", "commercial collapse"];

const failures = [
  ...required.filter(([, passed]) => !passed).map(([label]) => `Missing: ${label}`),
  ...forbidden.filter((term) => data.includes(term) || app.includes(term) || readme.includes(term)).map((term) => `Stale term: ${term}`),
];

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Smoke source checks passed for Canada + India launch scope.");
