import { civicDatasetContracts, cityProfiles, type LatLng } from "../data.js";
import { ensureTimescaleSchema, getTimescalePool, seedCityReferenceData, type GeoJsonGeometry } from "./timescale.js";

type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  properties?: Record<string, unknown>;
  geometry?: GeoJsonGeometry | null;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

interface CkanPackageResponse {
  success: boolean;
  result?: {
    resources?: Array<{
      id: string;
      name?: string;
      format?: string;
      url?: string;
      datastore_cache?: Record<string, Record<string, string>>;
    }>;
  };
}

export interface TorontoZoningIngestionOptions {
  maxFeatures?: number;
  dryRun?: boolean;
}

export interface TorontoZoningIngestionResult {
  datasetId: string;
  sourceUrl: string;
  scannedFeatures: number;
  matchedFeatures: number;
  insertedRows: number;
  dryRun: boolean;
  message: string;
}

const CKAN_PACKAGE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=zoning-by-law";
const DATASTORE_GEOJSON_RESOURCE_ID = "d75fa1ed-cd04-4a0b-bb6d-2b928ffffa6e";
const ZONING_AREA_RESOURCE_ID = "76a2620f-a6b4-495d-8e41-c0ede1f8a928";
const OBSERVED_AT = "2026-02-20T00:00:00.000Z";

const getTorontoZoningContract = () => {
  const contract = civicDatasetContracts.find((dataset) => dataset.id === "toronto-zoning-by-law");
  if (!contract) throw new Error("Toronto zoning dataset contract is missing.");
  return contract;
};

const numericEnv = (key: string, fallback: number) => {
  const value = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const resolveTorontoZoningGeojsonUrl = async () => {
  const response = await fetch(CKAN_PACKAGE_URL);
  if (!response.ok) throw new Error(`Toronto CKAN package lookup failed: ${response.status}`);
  const body = await response.json() as CkanPackageResponse;
  if (!body.success || !body.result?.resources) throw new Error("Toronto CKAN package lookup returned no resources.");

  const zoningArea = body.result.resources.find((resource) => resource.id === ZONING_AREA_RESOURCE_ID);
  const cachedGeojsonId = zoningArea?.datastore_cache?.GEOJSON?.["4326"] ?? DATASTORE_GEOJSON_RESOURCE_ID;
  const cachedGeojson = body.result.resources.find((resource) => resource.id === cachedGeojsonId);
  const directGeojson = body.result.resources.find((resource) =>
    resource.id === DATASTORE_GEOJSON_RESOURCE_ID
    || resource.name?.toLowerCase().includes("zoning area - 4326.geojson")
    || (resource.format?.toLowerCase() === "geojson" && resource.name?.toLowerCase().includes("zoning area")),
  );

  const resource = cachedGeojson ?? directGeojson;
  return resource?.url ?? `https://ckan0.cf.opendata.inter.prod-toronto.ca/datastore/dump/${cachedGeojsonId}?format=geojson`;
};

const flattenRings = (geometry: GeoJsonGeometry) =>
  geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat(1);

const pointInRing = (point: LatLng, ring: LatLng[]) => {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    const intersects = currentPoint.lat > point.lat !== previousPoint.lat > point.lat
      && point.lng < ((previousPoint.lng - currentPoint.lng) * (point.lat - currentPoint.lat)) / (previousPoint.lat - currentPoint.lat) + currentPoint.lng;
    if (intersects) inside = !inside;
  }
  return inside;
};

const toLatLngRing = (ring: number[][]): LatLng[] => ring.map(([lng, lat]) => ({ lat, lng }));

const geometryIntersectsCorridor = (geometry: GeoJsonGeometry, corridor: LatLng[]) => {
  const rings = flattenRings(geometry).map(toLatLngRing);
  return rings.some((ring) =>
    ring.some((point) => pointInRing(point, corridor))
    || corridor.some((point) => pointInRing(point, ring)),
  );
};

const zoningValue = (properties: Record<string, unknown>) => {
  const zoneString = properties.ZN_STRING ?? properties.zn_string;
  const zone = properties.ZN_ZONE ?? properties.zn_zone;
  return String(zoneString ?? zone ?? "Unknown zoning");
};

const zoningLabel = (properties: Record<string, unknown>) => {
  const zone = String(properties.ZN_ZONE ?? properties.zn_zone ?? "").toUpperCase();
  if (zone.startsWith("CR") || zone.startsWith("CRE") || zone.includes("COMMERCIAL")) return "Commercial";
  if (zone.startsWith("M") || zone.includes("MIXED")) return "Mixed Use";
  if (zone.startsWith("R")) return "Residential";
  if (zone.startsWith("E")) return "Employment / Industrial";
  if (zone.startsWith("O")) return "Open Space";
  if (zone.startsWith("I")) return "Institutional";
  return "Other Zoning";
};

export const ingestTorontoZoning = async (options: TorontoZoningIngestionOptions = {}): Promise<TorontoZoningIngestionResult> => {
  const pool = getTimescalePool();
  if (!pool) throw new Error("TIMESCALE_DATABASE_URL or DATABASE_URL is required for Toronto zoning ingestion.");

  const contract = getTorontoZoningContract();
  const maxFeatures = options.maxFeatures ?? numericEnv("TORONTO_ZONING_MAX_FEATURES", 500);
  const sourceUrl = await resolveTorontoZoningGeojsonUrl();
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`Toronto zoning GeoJSON fetch failed: ${response.status}`);
  const collection = await response.json() as GeoJsonFeatureCollection;
  if (collection.type !== "FeatureCollection" || !Array.isArray(collection.features)) {
    throw new Error("Toronto zoning GeoJSON did not return a FeatureCollection.");
  }

  const corridor = cityProfiles.toronto.geometry.bounds;
  const matched = collection.features
    .filter((feature) => feature.geometry && geometryIntersectsCorridor(feature.geometry, corridor))
    .slice(0, maxFeatures);

  if (options.dryRun) {
    return {
      datasetId: contract.id,
      sourceUrl,
      scannedFeatures: collection.features.length,
      matchedFeatures: matched.length,
      insertedRows: 0,
      dryRun: true,
      message: "Dry run completed without writing to TimescaleDB.",
    };
  }

  await ensureTimescaleSchema();
  const { corridorId } = await seedCityReferenceData("toronto");

  let insertedRows = 0;
  for (const [index, feature] of matched.entries()) {
    const properties = feature.properties ?? {};
    const id = `toronto-zoning-${feature.id ?? properties._id ?? properties.OBJECTID ?? index}`;
    await pool.query(
      `insert into temporal.layer_observations
        (id, city_id, corridor_id, layer, label, year_range, observed_at, source_id, dataset_id, provenance, value, geometry_geojson, properties, updated_at)
       values ($1, 'toronto', $2, 'zoning', $3, 'current', $4::timestamptz, $5, $6, 'live-civic-data', $7, $8::jsonb, $9::jsonb, now())
       on conflict (id, observed_at) do update set
         label = excluded.label,
         source_id = excluded.source_id,
         dataset_id = excluded.dataset_id,
         provenance = excluded.provenance,
         value = excluded.value,
         geometry_geojson = excluded.geometry_geojson,
         properties = excluded.properties,
         updated_at = now()`,
      [
        id,
        corridorId,
        zoningLabel(properties),
        OBSERVED_AT,
        contract.sourceId,
        contract.id,
        zoningValue(properties),
        JSON.stringify(feature.geometry),
        JSON.stringify(properties),
      ],
    );
    insertedRows += 1;
  }

  return {
    datasetId: contract.id,
    sourceUrl,
    scannedFeatures: collection.features.length,
    matchedFeatures: matched.length,
    insertedRows,
    dryRun: false,
    message: insertedRows > 0 ? "Toronto zoning rows ingested into TimescaleDB." : "No Toronto zoning features intersected the configured corridor.",
  };
};
