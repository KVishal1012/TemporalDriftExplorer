import { readFileSync } from "node:fs";

const data = readFileSync("src/data.ts", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const readme = readFileSync("README.md", "utf8");
const mapCanvas = readFileSync("src/MapCanvas.tsx", "utf8");
const providers = readFileSync("src/providers.ts", "utf8");
const schema = readFileSync("db/timescale_schema.sql", "utf8");
const envExample = readFileSync(".env.example", "utf8");

const required = [
  ["Toronto profile", data.includes('city: "Toronto"')],
  ["Chennai profile", data.includes('city: "Chennai"')],
  ["Canada market", data.includes('country: "Canada"')],
  ["India market", data.includes('country: "India"')],
  ["City switcher", app.includes("selectCity")],
  ["Market badge", app.includes("Canada + India only")],
  ["Google Maps env key", mapCanvas.includes("VITE_GOOGLE_MAPS_API_KEY")],
  ["Google Maps map surface", mapCanvas.includes("google.maps.Map")],
  ["AlphaEarth dataset", data.includes("GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")],
  ["AlphaEarth attribution", data.includes("The AlphaEarth Foundations Satellite Embedding dataset is produced by Google and Google DeepMind.")],
  ["AlphaEarth extraction plan", providers.includes("buildAlphaEarthExtractionPlan")],
  ["Timescale schema", schema.includes("create_hypertable") && schema.includes("temporal.alphaearth_embeddings")],
  ["Server-only AlphaEarth env", envExample.includes("EARTH_ENGINE_SERVICE_ACCOUNT") && envExample.includes("GOOGLE_APPLICATION_CREDENTIALS_JSON")],
  ["Source readiness endpoint docs", readme.includes("/api/cities/toronto/sources") && readme.includes("/api/integrations")],
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
