import { useEffect, useRef, useState } from "react";
import type { CityProfile, LatLng, LayerKey, LayerState, TemporalSnapshot } from "./data";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
        Polygon: new (options: Record<string, unknown>) => { setMap: (map: unknown | null) => void };
        Polyline: new (options: Record<string, unknown>) => { setMap: (map: unknown | null) => void };
        Marker: new (options: Record<string, unknown>) => { setMap: (map: unknown | null) => void };
      };
    };
    __temporalDriftGoogleMapsPromise?: Promise<void>;
  }
}

interface MapCanvasProps {
  profile: CityProfile;
  layers: LayerState[];
  snapshot: TemporalSnapshot;
  activeFinding: number;
  compare: boolean;
  swipe: number;
  year: number;
  onFindingSelect: (id: number) => void;
  onSwipeChange: (value: number) => void;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined;

const loadGoogleMaps = () => {
  if (window.google?.maps) return Promise.resolve();
  if (window.__temporalDriftGoogleMapsPromise) return window.__temporalDriftGoogleMapsPromise;

  window.__temporalDriftGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: GOOGLE_MAPS_API_KEY ?? "",
      v: "weekly",
      libraries: "maps",
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Google Maps JavaScript API failed to load.")));
    document.head.append(script);
  });

  return window.__temporalDriftGoogleMapsPromise;
};

const layer = (layers: LayerState[], id: LayerKey) => layers.find((item) => item.id === id)!;

const getProjectionDomain = (profile: CityProfile) => {
  const points = [
    ...profile.geometry.bounds,
    ...profile.geometry.businessDensityPath,
    ...profile.findings.map((finding) => finding.anchor),
  ];
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const latPadding = (Math.max(...lats) - Math.min(...lats)) * 0.18 || 0.002;
  const lngPadding = (Math.max(...lngs) - Math.min(...lngs)) * 0.18 || 0.002;

  return {
    minLat: Math.min(...lats) - latPadding,
    maxLat: Math.max(...lats) + latPadding,
    minLng: Math.min(...lngs) - lngPadding,
    maxLng: Math.max(...lngs) + lngPadding,
  };
};

const projectToSvg = (point: LatLng, domain: ReturnType<typeof getProjectionDomain>) => {
  const x = ((point.lng - domain.minLng) / (domain.maxLng - domain.minLng)) * 100;
  const y = ((domain.maxLat - point.lat) / (domain.maxLat - domain.minLat)) * 100;
  return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
};

const toSvgPath = (points: LatLng[], domain: ReturnType<typeof getProjectionDomain>) =>
  points.map((point, index) => {
    const projected = projectToSvg(point, domain);
    return `${index === 0 ? "M" : "L"}${projected.x} ${projected.y}`;
  }).join(" ");

const toSvgPolygon = (points: LatLng[], domain: ReturnType<typeof getProjectionDomain>) =>
  points.map((point) => {
    const projected = projectToSvg(point, domain);
    return `${projected.x},${projected.y}`;
  }).join(" ");

function MapCanvas({ profile, layers, snapshot, activeFinding, compare, swipe, year, onFindingSelect, onSwipeChange }: MapCanvasProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<Array<{ setMap: (map: unknown | null) => void }>>([]);
  const [map, setMap] = useState<unknown>(null);
  const [loadState, setLoadState] = useState<"missing-key" | "loading" | "ready" | "error">(
    GOOGLE_MAPS_API_KEY ? "loading" : "missing-key",
  );

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY || !mapRef.current) return;
    setLoadState("loading");
    loadGoogleMaps()
      .then(() => {
        if (!mapRef.current || !window.google?.maps) return;
        const nextMap = new window.google.maps.Map(mapRef.current, {
          center: profile.geometry.center,
          zoom: profile.geometry.zoom,
          tilt: profile.geometry.tilt,
          heading: profile.geometry.heading,
          mapId: GOOGLE_MAP_ID,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          backgroundColor: "#263436",
        });
        setMap(nextMap);
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, [profile.geometry.center, profile.geometry.heading, profile.geometry.tilt, profile.geometry.zoom]);

  useEffect(() => {
    overlayRef.current.forEach((overlay) => overlay.setMap(null));
    overlayRef.current = [];
    if (!map || !window.google?.maps) return;

    const overlays: Array<{ setMap: (map: unknown | null) => void }> = [];
    overlays.push(new window.google.maps.Polygon({
      paths: profile.geometry.bounds,
      strokeColor: "rgba(255,255,255,.9)",
      strokeOpacity: 0.88,
      strokeWeight: 2,
      fillColor: "#ee5b45",
      fillOpacity: 0.14,
      map,
    }));

    if (layer(layers, "zoning").enabled) {
      profile.geometry.zoningParcels.forEach((parcel) => overlays.push(new window.google!.maps.Polygon({
        paths: parcel.geometry,
        strokeColor: "rgba(255,255,255,.85)",
        strokeOpacity: 0.8,
        strokeWeight: 1,
        fillColor: parcel.color,
        fillOpacity: layer(layers, "zoning").opacity / 180,
        map,
      })));
    }

    if (layer(layers, "business").enabled) {
      overlays.push(new window.google.maps.Polyline({
        path: profile.geometry.businessDensityPath,
        strokeColor: "#f36a48",
        strokeOpacity: layer(layers, "business").opacity / 100,
        strokeWeight: Math.max(6, snapshot.businessIntensity / 8),
        map,
      }));
    }

    profile.findings.forEach((finding) => overlays.push(new window.google!.maps.Marker({
      position: finding.anchor,
      label: String(finding.id),
      title: finding.title,
      map,
    })));

    overlayRef.current = overlays;
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [activeFinding, layers, map, profile, snapshot.businessIntensity]);

  const projectionDomain = getProjectionDomain(profile);
  const fallbackBusinessPath = toSvgPath(profile.geometry.businessDensityPath, projectionDomain);
  const fallbackCorridorPoints = toSvgPolygon(profile.geometry.bounds, projectionDomain);

  return <section className="map-stage google-map-stage">
    <div ref={mapRef} className="google-map" aria-label={`${profile.city} Google Maps view`} />
    {loadState !== "ready" && <div className="map-config-warning">
      <strong>{loadState === "missing-key" ? "Google Maps key required" : loadState === "error" ? "Google Maps failed to load" : "Loading Google Maps"}</strong>
      <span>Set <code>VITE_GOOGLE_MAPS_API_KEY</code>{GOOGLE_MAP_ID ? "" : " and optionally VITE_GOOGLE_MAP_ID"} to render the live basemap.</span>
    </div>}
    <svg className="map-overlays fallback-overlays" viewBox="0 0 100 100" preserveAspectRatio="none">
      {layer(layers, "zoning").enabled && <g opacity={layer(layers, "zoning").opacity / 150}>
        <polygon points="8,8 33,5 32,42 5,45" fill="#df923e" stroke="rgba(255,255,255,.48)" strokeWidth=".22" />
        <polygon points="38,8 67,6 65,55 36,58" fill="#e8614e" stroke="rgba(255,255,255,.48)" strokeWidth=".22" />
        <polygon points="70,7 96,10 95,58 68,55" fill="#d4b637" stroke="rgba(255,255,255,.48)" strokeWidth=".22" />
      </g>}
      {layer(layers, "demographics").enabled && <g opacity={layer(layers, "demographics").opacity / 180}>
        <rect x="72" width="28" height="100" fill="#d1b83d" /><rect width="32" height="100" fill="#4278a2" />
      </g>}
      {layer(layers, "business").enabled && <path d={fallbackBusinessPath} fill="none" stroke="url(#heat)" strokeWidth={Math.max(7, snapshot.businessIntensity / 7)} strokeLinecap="round" opacity={layer(layers, "business").opacity / 100} />}
      <defs><linearGradient id="heat" x1="0" x2="1"><stop stopColor="#6c3e9f" /><stop offset=".46" stopColor="#d54f54" /><stop offset=".8" stopColor="#ff9d49" /><stop offset="1" stopColor="#ffe46a" /></linearGradient></defs>
      <polygon className="corridor" points={fallbackCorridorPoints} />
    </svg>
    {compare && <div className="swipe" style={{ left: `${swipe}%` }}><div className="before-after"><span>Before<br /><b>2012</b></span><span>After<br /><b>{year}</b></span></div><button>‹ ›</button></div>}
    <input className="swipe-range" aria-label="Before and after comparison divider" type="range" min="8" max="92" value={swipe} onChange={(event) => onSwipeChange(Number(event.target.value))} />
    {profile.findings.map((finding) => <button key={finding.id} style={{ left: `${finding.position.x}%`, top: `${finding.position.y}%` }} onClick={() => onFindingSelect(finding.id)} className={`map-pin ${activeFinding === finding.id ? "pin-active" : ""}`}>{finding.id}</button>)}
    <div className="map-label label-one">{profile.labels[0]}</div><div className="map-label label-two">{profile.labels[1]}</div><div className="map-label label-three">{profile.labels[2]}</div>
    <div className="map-tools"><button>+</button><button>−</button><button>⌖</button><button className="map-3d">3D</button></div>
    <div className="scale">Google Maps · 300 m</div>
  </section>;
}

export default MapCanvas;
