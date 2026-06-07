import pg from "pg";
import { cityProfiles, type CityKey, type LayerKey, type LayerObservation, type LatLng } from "../data.js";
import { timescaleSchemaSql } from "../timescaleSchema.js";

const { Pool } = pg;

type EnvMap = Record<string, string | undefined>;

interface DbLayerObservation {
  id: string;
  city_id: CityKey;
  layer: Exclude<LayerKey, "satellite">;
  label: string | null;
  year_range: string | null;
  source_id: string;
  provenance: "live-civic-data" | "seeded-fallback" | "alphaearth-embedding";
  value: string;
  geometry_geojson: GeoJsonGeometry;
}

export type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

const getEnv = (): EnvMap => {
  const processEnv = (globalThis as unknown as { process?: { env?: EnvMap } }).process?.env;
  return processEnv ?? {};
};

export const getTimescaleDatabaseUrl = (env: EnvMap = getEnv()) => env.TIMESCALE_DATABASE_URL ?? env.DATABASE_URL;

const globalPool = globalThis as unknown as { __temporalDriftPool?: pg.Pool };

export const getTimescalePool = () => {
  const connectionString = getTimescaleDatabaseUrl();
  if (!connectionString) return null;
  globalPool.__temporalDriftPool ??= new Pool({
    connectionString,
    max: 3,
    ssl: connectionString.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  });
  return globalPool.__temporalDriftPool;
};

export const ensureTimescaleSchema = async () => {
  const pool = getTimescalePool();
  if (!pool) throw new Error("TIMESCALE_DATABASE_URL or DATABASE_URL is required.");
  await pool.query(timescaleSchemaSql);
};

export const seedCityReferenceData = async (cityId: CityKey) => {
  const pool = getTimescalePool();
  if (!pool) throw new Error("TIMESCALE_DATABASE_URL or DATABASE_URL is required.");
  const profile = cityProfiles[cityId];
  const corridorId = `${cityId}-${profile.corridor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

  await pool.query(
    `insert into temporal.cities (id, name, country, country_code)
     values ($1, $2, $3, $4)
     on conflict (id) do update set name = excluded.name, country = excluded.country, country_code = excluded.country_code`,
    [profile.id, profile.city, profile.country, profile.countryCode],
  );

  await pool.query(
    `insert into temporal.corridors (id, city_id, name, center_lat, center_lng, geometry_geojson)
     values ($1, $2, $3, $4, $5, $6::jsonb)
     on conflict (id) do update set
       name = excluded.name,
       center_lat = excluded.center_lat,
       center_lng = excluded.center_lng,
       geometry_geojson = excluded.geometry_geojson`,
    [
      corridorId,
      profile.id,
      profile.corridor,
      profile.geometry.center.lat,
      profile.geometry.center.lng,
      JSON.stringify({
        type: "Polygon",
        coordinates: [[...profile.geometry.bounds, profile.geometry.bounds[0]].map((point) => [point.lng, point.lat])],
      }),
    ],
  );

  for (const source of profile.sources) {
    await pool.query(
      `insert into temporal.sources (id, city_id, provider, name, provenance, status, source_url, year_range, notes)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do update set
         city_id = excluded.city_id,
         provider = excluded.provider,
         name = excluded.name,
         provenance = excluded.provenance,
         status = excluded.status,
         source_url = excluded.source_url,
         year_range = excluded.year_range,
         notes = excluded.notes`,
      [source.id, profile.id, source.provider, source.name, source.provenance, source.status, source.url ?? null, source.yearRange, source.notes],
    );
  }

  return { corridorId };
};

const geometryToLatLngs = (geometry: GeoJsonGeometry): LatLng[] => {
  const ring = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0]?.[0];
  return (ring ?? []).map(([lng, lat]) => ({ lat, lng }));
};

export const readTimescaleLayerObservations = async (
  cityId: CityKey,
  layer?: Exclude<LayerKey, "satellite">,
): Promise<LayerObservation[]> => {
  const pool = getTimescalePool();
  if (!pool) return [];

  const params: Array<string> = [cityId];
  const layerFilter = layer ? "and layer = $2" : "";
  if (layer) params.push(layer);

  const result = await pool.query<DbLayerObservation>(
    `select id, city_id, layer, label, year_range, source_id, provenance, value, geometry_geojson
     from temporal.layer_observations
     where city_id = $1 ${layerFilter}
       and provenance = 'live-civic-data'
     order by observed_at desc, id asc
     limit 500`,
    params,
  );

  return result.rows.map((row) => ({
    id: row.id,
    cityId: row.city_id,
    layer: row.layer,
    label: row.label ?? row.value,
    yearRange: row.year_range ?? "current",
    sourceId: row.source_id,
    provenance: row.provenance,
    geometry: geometryToLatLngs(row.geometry_geojson),
    value: row.value,
  }));
};
