import {
  alphaEarthSummaries,
  civicDatasetContracts,
  civicIngestionTargets,
  cityProfiles,
  layerObservations,
  type CityKey,
  type CivicDatasetContract,
  type DataTruthLabel,
  type LayerObservation,
  type RealDataSource,
} from "./data.js";

type EnvMap = Record<string, string | undefined>;

export interface IntegrationReadiness {
  id: "google-maps" | "timescale" | "alphaearth";
  label: string;
  status: "configured" | "missing-env" | "source-metadata-ready";
  requiredEnv: string[];
  optionalEnv: string[];
  message: string;
}

export interface CitySourceReadiness {
  cityId: CityKey;
  corridor: string;
  sources: RealDataSource[];
  civicDatasets: CivicDatasetContract[];
  ingestionTargets: typeof civicIngestionTargets;
  loadedSourceObservations: LayerObservation[];
  fallbackObservations: LayerObservation[];
  truthLabels: DataTruthLabel[];
  liveRowsLoaded: number;
}

export interface AlphaEarthExtractionPlan {
  cityId: CityKey;
  corridor: string;
  datasetId: string;
  supportedYears: number[];
  geometry: {
    center: { lat: number; lng: number };
    bounds: Array<{ lat: number; lng: number }>;
  };
  credentialBoundary: {
    serverOnlyEnv: string[];
    browserEnv: string[];
  };
  steps: string[];
}

const hasAny = (env: EnvMap, keys: string[]) => keys.some((key) => Boolean(env[key]));
const hasAll = (env: EnvMap, keys: string[]) => keys.every((key) => Boolean(env[key]));

export const getEnv = (): EnvMap => {
  const processEnv = (globalThis as unknown as { process?: { env?: EnvMap } }).process?.env;
  return processEnv ?? {};
};

export const getIntegrationReadiness = (env: EnvMap = getEnv()): IntegrationReadiness[] => {
  const mapsConfigured = hasAny(env, ["VITE_GOOGLE_MAPS_API_KEY"]);
  const timescaleConfigured = hasAny(env, ["TIMESCALE_DATABASE_URL"]);
  const alphaEarthConfigured = hasAll(env, ["EARTH_ENGINE_SERVICE_ACCOUNT", "EARTH_ENGINE_PRIVATE_KEY"])
    || hasAny(env, ["GOOGLE_APPLICATION_CREDENTIALS_JSON"]);

  return [
    {
      id: "google-maps",
      label: "Google Maps JavaScript API",
      status: mapsConfigured ? "configured" : "missing-env",
      requiredEnv: ["VITE_GOOGLE_MAPS_API_KEY"],
      optionalEnv: ["VITE_GOOGLE_MAP_ID"],
      message: mapsConfigured ? "Live basemap can render in the browser build." : "Set the browser API key in Vercel to replace the fallback map notice.",
    },
    {
      id: "timescale",
      label: "TimescaleDB temporal store",
      status: timescaleConfigured ? "configured" : "missing-env",
      requiredEnv: ["TIMESCALE_DATABASE_URL"],
      optionalEnv: [],
      message: timescaleConfigured ? "Temporal database URL is present for server-side ingestion." : "Set a server-side TimescaleDB URL before replacing seeded snapshots.",
    },
    {
      id: "alphaearth",
      label: "AlphaEarth Foundations extraction",
      status: alphaEarthConfigured ? "configured" : "source-metadata-ready",
      requiredEnv: ["GOOGLE_APPLICATION_CREDENTIALS_JSON or EARTH_ENGINE_SERVICE_ACCOUNT + EARTH_ENGINE_PRIVATE_KEY"],
      optionalEnv: ["ALPHAEARTH_GCS_BUCKET"],
      message: alphaEarthConfigured ? "Server credentials are present for embedding extraction." : "Dataset metadata is ready; server credentials are still required.",
    },
  ];
};

export const getCitySourceReadiness = (cityId: CityKey): CitySourceReadiness => {
  const profile = cityProfiles[cityId];
  const cityObservations = layerObservations.filter((observation) => observation.cityId === cityId);

  return {
    cityId,
    corridor: profile.corridor,
    sources: profile.sources,
    civicDatasets: civicDatasetContracts.filter((dataset) => dataset.cityId === cityId),
    ingestionTargets: civicIngestionTargets.filter((target) => target.cityId === cityId),
    loadedSourceObservations: cityObservations.filter((observation) => observation.provenance === "live-civic-data"),
    fallbackObservations: cityObservations.filter((observation) => observation.provenance === "seeded-fallback"),
    truthLabels: profile.truthLabels,
    liveRowsLoaded: cityObservations.filter((observation) => observation.provenance === "live-civic-data").length,
  };
};

export const buildAlphaEarthExtractionPlan = (cityId: CityKey): AlphaEarthExtractionPlan => {
  const profile = cityProfiles[cityId];
  const alphaEarth = alphaEarthSummaries[cityId];

  return {
    cityId,
    corridor: profile.corridor,
    datasetId: alphaEarth.datasetId,
    supportedYears: alphaEarth.supportedYears,
    geometry: {
      center: profile.geometry.center,
      bounds: profile.geometry.bounds,
    },
    credentialBoundary: {
      serverOnlyEnv: [
        "GOOGLE_APPLICATION_CREDENTIALS_JSON",
        "EARTH_ENGINE_SERVICE_ACCOUNT",
        "EARTH_ENGINE_PRIVATE_KEY",
        "ALPHAEARTH_GCS_BUCKET",
      ],
      browserEnv: [],
    },
    steps: [
      "Authenticate on the server with Earth Engine or Google Cloud credentials.",
      "Clip annual AlphaEarth embeddings to the selected corridor bounds.",
      "Aggregate annual vectors into corridor-level summaries for 2017-2024.",
      "Write summary rows into temporal.alphaearth_embeddings for retrieval and comparison.",
    ],
  };
};
