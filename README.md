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
- Local generated aerial imagery for Toronto and Chennai
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

## Project Structure

```text
public/assets/toronto-king-west.jpg    Toronto launch corridor backdrop
public/assets/chennai-anna-salai.jpg   Chennai launch corridor backdrop
src/App.tsx                            Main interactive workspace
src/data.ts                            Typed city profiles, snapshots, events, findings, and evidence
src/styles.css                         Desktop and tablet visual system
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

## Future Direction

A full-stack version can replace the local seed module with:

- TimescaleDB time-travel queries for historical spatial snapshots
- Toronto and Chennai parcel, zoning, business, mobility, and demographic datasets
- Live map tiles through MapLibre or another mapping engine
- A retrieval layer that assembles temporal and spatial evidence
- An LLM endpoint that returns cited, map-anchored explanations

## Current Status

This repository contains an interactive frontend demo for Toronto and Chennai. It does not yet connect to TimescaleDB, external map tiles, or a live model endpoint.
