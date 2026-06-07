export type LayerKey = "satellite" | "zoning" | "business" | "demographics";
export type CityKey = "toronto" | "chennai";
export type ProvenanceKind = "live-civic-data" | "alphaearth-embedding" | "seeded-fallback";
export type SourceStatus = "source-metadata-ready" | "pending-live-ingestion";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface LayerState {
  id: LayerKey;
  label: string;
  opacity: number;
  enabled: boolean;
}

export interface TemporalSnapshot {
  year: number;
  vacancy: number;
  footTraffic: number;
  turnover: number;
  businessIntensity: number;
  provenance: ProvenanceKind;
}

export interface TimelineEvent {
  year: number;
  title: string;
  detail: string;
  tone: "coral" | "teal";
}

export interface RealDataSource {
  id: string;
  name: string;
  provider: string;
  country: "Canada" | "India" | "Global";
  status: SourceStatus;
  yearRange: string;
  url?: string;
  ingestionTarget: "timescale-layer" | "alphaearth-summary" | "evidence-series";
  notes: string;
  provenance: ProvenanceKind;
}

export interface EvidenceSeries {
  label: string;
  startValue: string;
  endValue: string;
  sourceId: string;
  color: string;
  values: number[];
  provenance: ProvenanceKind;
}

export interface SpatialFinding {
  id: number;
  title: string;
  body: string;
  position: { x: number; y: number };
  anchor: LatLng;
  sourceIds: string[];
  provenance: ProvenanceKind;
}

export interface CorridorGeometry {
  center: LatLng;
  zoom: number;
  tilt: number;
  heading: number;
  bounds: LatLng[];
  businessDensityPath: LatLng[];
  demographicAreas: LatLng[][];
  zoningParcels: Array<{ id: string; use: string; color: string; geometry: LatLng[] }>;
}

export interface LayerObservation {
  id: string;
  cityId: CityKey;
  layer: Exclude<LayerKey, "satellite">;
  label: string;
  yearRange: string;
  sourceId: string;
  provenance: ProvenanceKind;
  geometry: LatLng[];
  value: string;
}

export interface CivicIngestionTarget {
  id: string;
  cityId: CityKey;
  sourceId: string;
  layer: Exclude<LayerKey, "satellite">;
  corridor: string;
  providerEndpoint: string;
  targetTable: string;
  status: SourceStatus;
  nextAction: string;
}

export interface AlphaEarthEmbeddingSummary {
  datasetId: "GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL";
  sourceId: "alphaearth-foundations";
  cityId: CityKey;
  supportedYears: number[];
  resolutionMeters: 10;
  channelCount: 64;
  status: "configured-provider-pending-credentials";
  attribution: string;
  notes: string;
}

export interface CityProfile {
  id: CityKey;
  city: string;
  country: "Canada" | "India";
  countryCode: "CA" | "IN";
  corridor: string;
  labels: [string, string, string];
  question: string;
  geometry: CorridorGeometry;
  snapshots: TemporalSnapshot[];
  events: TimelineEvent[];
  findings: SpatialFinding[];
  evidence: EvidenceSeries[];
  sources: RealDataSource[];
}

export const years = Array.from({ length: 17 }, (_, index) => 2008 + index);
export const alphaEarthYears = Array.from({ length: 8 }, (_, index) => 2017 + index);

export const alphaEarthSource: RealDataSource = {
  id: "alphaearth-foundations",
  name: "AlphaEarth Foundations Satellite Embedding V1 Annual",
  provider: "Google / Google DeepMind",
  country: "Global",
  status: "pending-live-ingestion",
  yearRange: "2017-2024",
  url: "https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL",
  ingestionTarget: "alphaearth-summary",
  notes: "Annual 10 m satellite embeddings with 64 channels. Access requires Earth Engine or Google Cloud Storage credentials.",
  provenance: "alphaearth-embedding",
};

const attribution = "The AlphaEarth Foundations Satellite Embedding dataset is produced by Google and Google DeepMind.";

const ll = (lat: number, lng: number): LatLng => ({ lat, lng });

const createSnapshots = (mode: "resilience" | "intensification"): TemporalSnapshot[] =>
  years.map((year) => {
    const elapsed = year - 2008;
    const change = Math.max(0, year - 2012);
    if (mode === "resilience") {
      return {
        year,
        vacancy: Math.max(5, Math.round(13 - change * 0.65 + Math.max(0, year - 2020) * 0.8)),
        footTraffic: Math.round(52 + change * 1.65 - Math.max(0, year - 2020) * 2.1),
        turnover: Math.round(17 + elapsed * 0.32),
        businessIntensity: Math.min(96, 62 + change * 3.4),
        provenance: "seeded-fallback",
      };
    }
    return {
      year,
      vacancy: Math.max(4, Math.round(14 - change * 0.72)),
      footTraffic: Math.round(46 + change * 2.15 - Math.max(0, year - 2020) * 1.3),
      turnover: Math.round(16 + elapsed * 0.48),
      businessIntensity: Math.min(98, 57 + change * 4.1),
      provenance: "seeded-fallback",
    };
  });

export const initialLayers: LayerState[] = [
  { id: "satellite", label: "Google Maps basemap", opacity: 100, enabled: true },
  { id: "zoning", label: "Land-use zoning", opacity: 48, enabled: false },
  { id: "business", label: "Business density", opacity: 72, enabled: true },
  { id: "demographics", label: "Demographics", opacity: 42, enabled: false },
];

export const cityProfiles: Record<CityKey, CityProfile> = {
  toronto: {
    id: "toronto",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    corridor: "King Street West",
    labels: ["Queen St W", "King St W", "Spadina Ave"],
    question: "What drove commercial resilience along King Street West between 2012 and 2018?",
    geometry: {
      center: ll(43.6448, -79.3985),
      zoom: 15,
      tilt: 45,
      heading: 82,
      bounds: [ll(43.6437, -79.4092), ll(43.6470, -79.3868), ll(43.6457, -79.3862), ll(43.6422, -79.4086)],
      businessDensityPath: [ll(43.6429, -79.4084), ll(43.6440, -79.4025), ll(43.6451, -79.3966), ll(43.6462, -79.3891)],
      demographicAreas: [
        [ll(43.6444, -79.409), ll(43.6452, -79.402), ll(43.6429, -79.402), ll(43.6422, -79.410)],
        [ll(43.6464, -79.394), ll(43.6472, -79.386), ll(43.6449, -79.386), ll(43.6441, -79.395)],
      ],
      zoningParcels: [
        { id: "tor-mixed-1", use: "Mixed Use", color: "#df923e", geometry: [ll(43.6438, -79.409), ll(43.6448, -79.401), ll(43.6434, -79.400), ll(43.6424, -79.408)] },
        { id: "tor-commercial-1", use: "Commercial", color: "#e8614e", geometry: [ll(43.6448, -79.401), ll(43.6459, -79.394), ll(43.6445, -79.393), ll(43.6434, -79.400)] },
        { id: "tor-residential-1", use: "Residential", color: "#d4b637", geometry: [ll(43.6459, -79.394), ll(43.6470, -79.386), ll(43.6456, -79.386), ll(43.6445, -79.393)] },
      ],
    },
    snapshots: createSnapshots("resilience"),
    events: [
      { year: 2009, title: "Recession recovery", detail: "Retail stabilization", tone: "teal" },
      { year: 2013, title: "Office conversions", detail: "Daytime demand", tone: "teal" },
      { year: 2015, title: "Mixed-use growth", detail: "New frontage", tone: "coral" },
      { year: 2017, title: "Transit pilot", detail: "Streetcar priority", tone: "teal" },
      { year: 2020, title: "COVID-19 impact", detail: "Foot traffic shock", tone: "coral" },
    ],
    findings: [
      { id: 1, title: "Mixed-use infill strengthened daytime demand", body: "Seeded fallback finding aligned to Toronto Open Data source slots until live ingestion is configured.", position: { x: 28, y: 45 }, anchor: ll(43.6434, -79.4055), sourceIds: ["toronto-open-data", "alphaearth-foundations"], provenance: "seeded-fallback" },
      { id: 2, title: "Transit priority improved corridor access", body: "Streetcar and walkability evidence will be joined with corridor observations once live feeds are connected.", position: { x: 52, y: 50 }, anchor: ll(43.6450, -79.3972), sourceIds: ["ttc-open-data", "alphaearth-foundations"], provenance: "seeded-fallback" },
      { id: 3, title: "Residential growth supported evening activity", body: "Statistics Canada source metadata is ready; current values remain fallback demo observations.", position: { x: 76, y: 44 }, anchor: ll(43.6460, -79.3895), sourceIds: ["statistics-canada", "alphaearth-foundations"], provenance: "seeded-fallback" },
    ],
    evidence: [
      { label: "Commercial vacancy rate", startValue: "13%", endValue: "7%", sourceId: "toronto-open-data", color: "#ee6846", values: [13, 12, 12, 11, 10, 10, 9, 9, 8, 8, 7, 7, 7, 7], provenance: "seeded-fallback" },
      { label: "Avg. daily foot traffic", startValue: "52K", endValue: "68K", sourceId: "ttc-open-data", color: "#238e91", values: [52, 53, 54, 55, 57, 58, 59, 61, 62, 64, 65, 66, 67, 68], provenance: "seeded-fallback" },
      { label: "Residential index", startValue: "100", endValue: "126", sourceId: "statistics-canada", color: "#8a50aa", values: [100, 102, 104, 105, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126], provenance: "seeded-fallback" },
    ],
    sources: [
      { id: "toronto-open-data", name: "Toronto Open Data", provider: "City of Toronto", country: "Canada", status: "source-metadata-ready", yearRange: "varies by dataset", url: "https://open.toronto.ca/", ingestionTarget: "timescale-layer", notes: "Source slot for parcel, zoning, business, and corridor civic layers.", provenance: "live-civic-data" },
      { id: "ttc-open-data", name: "TTC Open Data", provider: "Toronto Transit Commission", country: "Canada", status: "source-metadata-ready", yearRange: "varies by dataset", url: "https://open.toronto.ca/catalogue/?search=ttc", ingestionTarget: "evidence-series", notes: "Source slot for transit-adjacent mobility and access signals.", provenance: "live-civic-data" },
      { id: "statistics-canada", name: "Statistics Canada", provider: "Government of Canada", country: "Canada", status: "source-metadata-ready", yearRange: "2016-2021+", url: "https://www.statcan.gc.ca/", ingestionTarget: "evidence-series", notes: "Source slot for demographic and household observations.", provenance: "live-civic-data" },
      alphaEarthSource,
    ],
  },
  chennai: {
    id: "chennai",
    city: "Chennai",
    country: "India",
    countryCode: "IN",
    corridor: "Anna Salai",
    labels: ["Thousand Lights", "Anna Salai", "Teynampet"],
    question: "What drove commercial intensification along Anna Salai between 2012 and 2018?",
    geometry: {
      center: ll(13.0452, 80.2482),
      zoom: 14,
      tilt: 45,
      heading: 8,
      bounds: [ll(13.064, 80.246), ll(13.061, 80.260), ll(13.027, 80.252), ll(13.031, 80.238)],
      businessDensityPath: [ll(13.061, 80.248), ll(13.054, 80.249), ll(13.045, 80.247), ll(13.034, 80.245)],
      demographicAreas: [
        [ll(13.064, 80.239), ll(13.058, 80.247), ll(13.045, 80.242), ll(13.050, 80.234)],
        [ll(13.049, 80.254), ll(13.043, 80.262), ll(13.030, 80.254), ll(13.036, 80.248)],
      ],
      zoningParcels: [
        { id: "chn-commercial-1", use: "Commercial", color: "#e8614e", geometry: [ll(13.059, 80.244), ll(13.058, 80.252), ll(13.050, 80.251), ll(13.051, 80.242)] },
        { id: "chn-mixed-1", use: "Mixed Use", color: "#df923e", geometry: [ll(13.049, 80.243), ll(13.048, 80.253), ll(13.039, 80.251), ll(13.040, 80.241)] },
        { id: "chn-residential-1", use: "Residential", color: "#d4b637", geometry: [ll(13.039, 80.248), ll(13.037, 80.257), ll(13.030, 80.253), ll(13.032, 80.245)] },
      ],
    },
    snapshots: createSnapshots("intensification"),
    events: [
      { year: 2009, title: "IT services growth", detail: "Office demand", tone: "teal" },
      { year: 2013, title: "Metro construction", detail: "Access disruption", tone: "coral" },
      { year: 2015, title: "Flood impact", detail: "Short-term vacancy", tone: "coral" },
      { year: 2017, title: "Metro opening", detail: "Transit uplift", tone: "teal" },
      { year: 2020, title: "COVID-19 impact", detail: "Foot traffic shock", tone: "coral" },
    ],
    findings: [
      { id: 1, title: "Metro access expanded the catchment area", body: "CMRL source metadata is ready; current values remain fallback demo observations.", position: { x: 46, y: 26 }, anchor: ll(13.055, 80.248), sourceIds: ["cmrl-open-data", "alphaearth-foundations"], provenance: "seeded-fallback" },
      { id: 2, title: "Office demand intensified along Anna Salai", body: "Services-sector and corridor intensity layers are prepared for live civic ingestion.", position: { x: 57, y: 52 }, anchor: ll(13.046, 80.247), sourceIds: ["cmda-planning", "alphaearth-foundations"], provenance: "seeded-fallback" },
      { id: 3, title: "Mixed-use redevelopment absorbed vacant parcels", body: "Urban form change will be cross-checked against AlphaEarth embeddings once credentials are configured.", position: { x: 77, y: 38 }, anchor: ll(13.037, 80.252), sourceIds: ["cmda-planning", "alphaearth-foundations"], provenance: "seeded-fallback" },
    ],
    evidence: [
      { label: "Commercial vacancy rate", startValue: "14%", endValue: "8%", sourceId: "cmda-planning", color: "#ee6846", values: [14, 14, 13, 13, 12, 11, 11, 10, 10, 9, 9, 8, 8, 8], provenance: "seeded-fallback" },
      { label: "Avg. daily foot traffic", startValue: "46K", endValue: "71K", sourceId: "cmrl-open-data", color: "#238e91", values: [46, 48, 49, 51, 54, 56, 58, 60, 62, 65, 67, 68, 70, 71], provenance: "seeded-fallback" },
      { label: "Commercial intensity", startValue: "100", endValue: "138", sourceId: "cmda-planning", color: "#8a50aa", values: [100, 102, 105, 108, 112, 115, 118, 121, 124, 127, 130, 133, 136, 138], provenance: "seeded-fallback" },
    ],
    sources: [
      { id: "cmda-planning", name: "CMDA planning datasets", provider: "Chennai Metropolitan Development Authority", country: "India", status: "source-metadata-ready", yearRange: "varies by dataset", url: "https://cmdachennai.gov.in/", ingestionTarget: "timescale-layer", notes: "Source slot for planning, land-use, corridor, and redevelopment layers.", provenance: "live-civic-data" },
      { id: "cmrl-open-data", name: "CMRL transit datasets", provider: "Chennai Metro Rail Limited", country: "India", status: "source-metadata-ready", yearRange: "varies by dataset", url: "https://chennaimetrorail.org/", ingestionTarget: "evidence-series", notes: "Source slot for metro access and transit-adjacent corridor signals.", provenance: "live-civic-data" },
      alphaEarthSource,
    ],
  },
};

export const civicIngestionTargets: CivicIngestionTarget[] = [
  {
    id: "toronto-zoning-corridor",
    cityId: "toronto",
    sourceId: "toronto-open-data",
    layer: "zoning",
    corridor: "King Street West",
    providerEndpoint: "https://open.toronto.ca/",
    targetTable: "temporal.layer_observations",
    status: "source-metadata-ready",
    nextAction: "Select the authoritative Toronto zoning/package endpoint, then clip parcels to the King Street West corridor.",
  },
  {
    id: "chennai-planning-corridor",
    cityId: "chennai",
    sourceId: "cmda-planning",
    layer: "zoning",
    corridor: "Anna Salai",
    providerEndpoint: "https://cmdachennai.gov.in/",
    targetTable: "temporal.layer_observations",
    status: "source-metadata-ready",
    nextAction: "Confirm CMDA land-use export access, then normalize planning polygons for the Anna Salai corridor.",
  },
];

export const layerObservations: LayerObservation[] = Object.values(cityProfiles).flatMap((profile) => [
  ...profile.geometry.zoningParcels.map((parcel) => ({
    id: parcel.id,
    cityId: profile.id,
    layer: "zoning" as const,
    label: parcel.use,
    yearRange: "2012-2024",
    sourceId: profile.sources[0].id,
    provenance: "live-civic-data" as const,
    geometry: parcel.geometry,
    value: parcel.use,
  })),
  {
    id: `${profile.id}-business-density`,
    cityId: profile.id,
    layer: "business" as const,
    label: "Business density corridor path",
    yearRange: "2012-2024",
    sourceId: profile.sources[0].id,
    provenance: "seeded-fallback" as const,
    geometry: profile.geometry.businessDensityPath,
    value: "fallback intensity path",
  },
]);

export const alphaEarthSummaries: Record<CityKey, AlphaEarthEmbeddingSummary> = {
  toronto: {
    datasetId: "GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL",
    sourceId: "alphaearth-foundations",
    cityId: "toronto",
    supportedYears: alphaEarthYears,
    resolutionMeters: 10,
    channelCount: 64,
    status: "configured-provider-pending-credentials",
    attribution,
    notes: "Use Earth Engine or GCS to extract annual embedding vectors intersecting the King Street West corridor.",
  },
  chennai: {
    datasetId: "GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL",
    sourceId: "alphaearth-foundations",
    cityId: "chennai",
    supportedYears: alphaEarthYears,
    resolutionMeters: 10,
    channelCount: 64,
    status: "configured-provider-pending-credentials",
    attribution,
    notes: "Use Earth Engine or GCS to extract annual embedding vectors intersecting the Anna Salai corridor.",
  },
};
