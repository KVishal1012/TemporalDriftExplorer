export type LayerKey = "satellite" | "zoning" | "business" | "demographics";
export type CityKey = "toronto" | "chennai";

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
}

export interface TimelineEvent {
  year: number;
  title: string;
  detail: string;
  tone: "coral" | "teal";
}

export interface EvidenceSeries {
  label: string;
  startValue: string;
  endValue: string;
  source: string;
  color: string;
  values: number[];
}

export interface SpatialFinding {
  id: number;
  title: string;
  body: string;
  position: { x: number; y: number };
}

export interface CityProfile {
  id: CityKey;
  city: string;
  country: "Canada" | "India";
  countryCode: "CA" | "IN";
  corridor: string;
  asset: string;
  alt: string;
  labels: [string, string, string];
  question: string;
  snapshots: TemporalSnapshot[];
  events: TimelineEvent[];
  findings: SpatialFinding[];
  evidence: EvidenceSeries[];
}

export const years = Array.from({ length: 17 }, (_, index) => 2008 + index);

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
      };
    }
    return {
      year,
      vacancy: Math.max(4, Math.round(14 - change * 0.72)),
      footTraffic: Math.round(46 + change * 2.15 - Math.max(0, year - 2020) * 1.3),
      turnover: Math.round(16 + elapsed * 0.48),
      businessIntensity: Math.min(98, 57 + change * 4.1),
    };
  });

export const initialLayers: LayerState[] = [
  { id: "satellite", label: "Satellite imagery", opacity: 100, enabled: true },
  { id: "zoning", label: "Land-use zoning", opacity: 64, enabled: true },
  { id: "business", label: "Business density", opacity: 72, enabled: true },
  { id: "demographics", label: "Demographics", opacity: 52, enabled: true },
];

export const cityProfiles: Record<CityKey, CityProfile> = {
  toronto: {
    id: "toronto",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    corridor: "King Street West",
    asset: "/assets/toronto-king-west.jpg",
    alt: "Aerial view of the King Street West corridor in Toronto",
    labels: ["Queen St W", "King St W", "Spadina Ave"],
    question: "What drove commercial resilience along King Street West between 2012 and 2018?",
    snapshots: createSnapshots("resilience"),
    events: [
      { year: 2009, title: "Recession recovery", detail: "Retail stabilization", tone: "teal" },
      { year: 2013, title: "Office conversions", detail: "Daytime demand", tone: "teal" },
      { year: 2015, title: "Mixed-use growth", detail: "New frontage", tone: "coral" },
      { year: 2017, title: "Transit pilot", detail: "Streetcar priority", tone: "teal" },
      { year: 2020, title: "COVID-19 impact", detail: "Foot traffic shock", tone: "coral" },
    ],
    findings: [
      {
        id: 1,
        title: "Mixed-use infill strengthened daytime demand",
        body: "New residential and office density increased the corridor's daily customer base and supported a broader tenant mix.",
        position: { x: 46, y: 25 },
      },
      {
        id: 2,
        title: "Transit priority improved corridor access",
        body: "Streetcar reliability and walkable blocks increased visits along King Street West despite rising congestion nearby.",
        position: { x: 57, y: 52 },
      },
      {
        id: 3,
        title: "Residential growth supported evening activity",
        body: "Population gains around the corridor expanded restaurant and service demand beyond office hours.",
        position: { x: 77, y: 38 },
      },
    ],
    evidence: [
      { label: "Commercial vacancy rate", startValue: "13%", endValue: "7%", source: "Toronto Open Data", color: "#ee6846", values: [13, 12, 12, 11, 10, 10, 9, 9, 8, 8, 7, 7, 7, 7] },
      { label: "Avg. daily foot traffic", startValue: "52K", endValue: "68K", source: "TTC / Seeded", color: "#238e91", values: [52, 53, 54, 55, 57, 58, 59, 61, 62, 64, 65, 66, 67, 68] },
      { label: "Residential index", startValue: "100", endValue: "126", source: "Statistics Canada", color: "#8a50aa", values: [100, 102, 104, 105, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126] },
    ],
  },
  chennai: {
    id: "chennai",
    city: "Chennai",
    country: "India",
    countryCode: "IN",
    corridor: "Anna Salai",
    asset: "/assets/chennai-anna-salai.jpg",
    alt: "Aerial view of the Anna Salai corridor in Chennai",
    labels: ["Thousand Lights", "Anna Salai", "Teynampet"],
    question: "What drove commercial intensification along Anna Salai between 2012 and 2018?",
    snapshots: createSnapshots("intensification"),
    events: [
      { year: 2009, title: "IT services growth", detail: "Office demand", tone: "teal" },
      { year: 2013, title: "Metro construction", detail: "Access disruption", tone: "coral" },
      { year: 2015, title: "Flood impact", detail: "Short-term vacancy", tone: "coral" },
      { year: 2017, title: "Metro opening", detail: "Transit uplift", tone: "teal" },
      { year: 2020, title: "COVID-19 impact", detail: "Foot traffic shock", tone: "coral" },
    ],
    findings: [
      {
        id: 1,
        title: "Metro access expanded the catchment area",
        body: "New stations increased corridor accessibility and supported commercial activity around major intersections.",
        position: { x: 46, y: 26 },
      },
      {
        id: 2,
        title: "Office demand intensified along Anna Salai",
        body: "Services-sector growth increased daytime foot traffic and supported retail frontage along the arterial corridor.",
        position: { x: 57, y: 52 },
      },
      {
        id: 3,
        title: "Mixed-use redevelopment absorbed vacant parcels",
        body: "New commercial and residential projects reduced vacancy while increasing activity around Teynampet.",
        position: { x: 77, y: 38 },
      },
    ],
    evidence: [
      { label: "Commercial vacancy rate", startValue: "14%", endValue: "8%", source: "CMDA / Seeded", color: "#ee6846", values: [14, 14, 13, 13, 12, 11, 11, 10, 10, 9, 9, 8, 8, 8] },
      { label: "Avg. daily foot traffic", startValue: "46K", endValue: "71K", source: "CMRL / Seeded", color: "#238e91", values: [46, 48, 49, 51, 54, 56, 58, 60, 62, 65, 67, 68, 70, 71] },
      { label: "Commercial intensity", startValue: "100", endValue: "138", source: "CMDA / Seeded", color: "#8a50aa", values: [100, 102, 105, 108, 112, 115, 118, 121, 124, 127, 130, 133, 136, 138] },
    ],
  },
};
