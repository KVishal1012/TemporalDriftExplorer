# Temporal Drift Explorer

Temporal Drift Explorer is a desktop-first geospatial analytics demo for investigating how urban corridors change over time. The product is scoped exclusively to Canada and India, starting with Toronto and Chennai as the first launch cities.

The current version is an interactive frontend prototype with local seeded data. It is designed as a foundation for a future TimescaleDB-backed application with real time-travel queries and model-generated spatial explanations.

## Launch Markets

- **Canada:** Toronto, beginning with the King Street West corridor
- **India:** Chennai, beginning with the Anna Salai corridor

The app deliberately avoids generic “any city” behavior in this first release. The initial experience is curated around two markets where corridor change, zoning, mobility, business density, and demographic evidence can be modeled deeply.

## What It Demonstrates

- A map-first analyst workspace for Canada and India
- City switching between Toronto and Chennai
- Timeline playback and manual year selection from `2008` through `2024`
- A `2012 -> 2018` before-and-after comparison mode with a draggable swipe divider
- Synchronized satellite imagery, land-use zoning, business-density, and demographic layers
- Layer visibility toggles and opacity controls
- Timeline event markers customized per city
- A seeded Spatial Explainer that links causal findings to numbered map pins
- Compact evidence charts with city-specific source labels
- A desktop-first layout with collapsible panels for smaller screens

## Spatial Explainer

The demo includes market-specific prompts:

- Toronto: “What drove commercial resilience along King Street West between 2012 and 2018?”
- Chennai: “What drove commercial intensification along Anna Salai between 2012 and 2018?”

Each explainer returns map-anchored findings that can be selected from the explainer panel or directly from the map. The supporting evidence section visualizes seeded vacancy, foot-traffic, and corridor-intensity trends.

## Tech Stack

- React
- TypeScript
- Vite
- Lucide React icons
- Google Maps JavaScript API-ready basemap component with a no-key fallback
- AlphaEarth Foundations provider metadata and API scaffold
- Code-native SVG overlays for zoning, density, corridor boundaries, and map pins

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run the TypeScript check:

```bash
npm run typecheck
```

Run the launch-scope smoke check:

```bash
npm run smoke
```

Configure Google Maps for the live basemap:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
VITE_GOOGLE_MAP_ID=your_optional_vector_map_id
```

## Project Structure

```text
src/App.tsx                            Main interactive workspace
src/data.ts                            Typed city profiles, source metadata, snapshots, layers, AlphaEarth summaries
src/MapCanvas.tsx                      Native Google Maps JavaScript API map surface
src/styles.css                         Desktop and tablet visual system
api/cities.ts                          JSON-backed launch city listing
api/cities/[cityId]/profile.ts         City profile endpoint
api/cities/[cityId]/snapshots.ts       Temporal snapshot endpoint
api/cities/[cityId]/layers.ts          Layer observations and source metadata
api/cities/[cityId]/alphaearth.ts      AlphaEarth Foundations metadata endpoint
```

## Data Model

The seeded frontend data boundary is intentionally typed and replaceable:

- `CityProfile` defines each supported launch market.
- `TemporalSnapshot` stores year-specific corridor indicators.
- `LayerState` controls layer visibility and opacity.
- `TimelineEvent` marks notable changes on the temporal rail.
- `SpatialFinding` links explanatory text to a map coordinate.
- `EvidenceSeries` powers the supporting trend charts.

This keeps the current demo deterministic while leaving a clear path to a production architecture.

## API Boundary

The current API is JSON-backed by the same typed city profiles used by the frontend:

- `GET /api/cities`
- `GET /api/cities/toronto/profile`
- `GET /api/cities/toronto/snapshots`
- `GET /api/cities/toronto/layers`
- `GET /api/cities/toronto/alphaearth`
- `GET /api/cities/chennai/profile`
- `GET /api/cities/chennai/snapshots`
- `GET /api/cities/chennai/layers`
- `GET /api/cities/chennai/alphaearth`

Unsupported cities return a message that Temporal Drift Explorer currently supports Toronto and Chennai only.

## Data Provenance

The UI now distinguishes source types:

- `live-civic-data`: source slots for Toronto Open Data, TTC, Statistics Canada, CMDA, and CMRL.
- `alphaearth-embedding`: AlphaEarth Foundations Satellite Embedding V1 Annual metadata.
- `seeded-fallback`: temporary demo values that must not be treated as real measurements.

AlphaEarth attribution: “The AlphaEarth Foundations Satellite Embedding dataset is produced by Google and Google DeepMind.”

The previous generated corridor JPEG backdrops have been removed. The map surface now attempts to load Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is configured. Without a key, the app keeps working with the code-native corridor overlays and displays a configuration notice instead of pretending that synthetic imagery is real.

## Future Direction

A full-stack version can replace the local seed module with:

- TimescaleDB time-travel queries for historical spatial snapshots
- Toronto and Chennai parcel, zoning, business, mobility, and demographic datasets
- Live Google Maps layers and/or MapLibre tiles where licensing and data access fit the market
- A retrieval layer that assembles temporal and spatial evidence
- An LLM endpoint that returns cited, map-anchored explanations

## Current Status

This repository contains an interactive frontend demo for Toronto and Chennai with a Google Maps-ready map surface, civic source metadata, AlphaEarth Foundations metadata, and JSON API boundaries. It does not yet run live TimescaleDB queries, fetch Google Earth Engine embeddings, ingest civic datasets, or call a live model endpoint.
