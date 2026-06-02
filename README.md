# Temporal Drift Explorer

Temporal Drift Explorer is a desktop-first geospatial analytics demo for investigating how an urban corridor changes over time. It presents a Detroit commercial corridor as a synchronized temporal workspace: drag the timeline, compare years, toggle spatial layers, and inspect an AI-style explanation anchored to specific locations on the map.

The current version is an interactive frontend prototype with local seeded data. It is designed as a foundation for a future TimescaleDB-backed application with real time-travel queries and model-generated spatial explanations.

## What It Demonstrates

- A map-first analyst workspace focused on one Detroit commercial corridor
- Timeline playback and manual year selection from `2008` through `2024`
- A `2012 -> 2018` before-and-after comparison mode with a draggable swipe divider
- Synchronized satellite imagery, land-use zoning, business-density, and demographic layers
- Layer visibility toggles and opacity controls
- Timeline event markers for notable corridor changes
- A seeded Spatial Explainer that links causal findings to numbered map pins
- Compact evidence charts with source labels
- A desktop-first layout with collapsible panels for smaller screens

## Spatial Explainer

The demo is centered on a sample research question:

> What caused the commercial collapse in this corridor between 2012 and 2018?

The explainer returns three map-anchored findings:

1. Vacancy accelerated after an anchor retail closure.
2. Foot traffic fell along Woodward Avenue.
3. Residential turnover increased east of the corridor.

Each finding can be selected from the explainer panel or directly from the map. The supporting evidence section visualizes seeded vacancy, foot-traffic, and residential-turnover trends.

## Tech Stack

- React
- TypeScript
- Vite
- Lucide React icons
- Local generated aerial imagery
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
public/assets/detroit-corridor.png  Local aerial map backdrop
src/App.tsx                         Main interactive workspace
src/data.ts                        Typed snapshots, events, findings, and evidence
src/styles.css                      Desktop and tablet visual system
```

## Data Model

The seeded frontend data boundary is intentionally typed and replaceable:

- `TemporalSnapshot` stores year-specific corridor indicators.
- `LayerState` controls layer visibility and opacity.
- `TimelineEvent` marks notable changes on the temporal rail.
- `SpatialFinding` links explanatory text to a map coordinate.
- `EvidenceSeries` powers the supporting trend charts.

This keeps the current demo deterministic while leaving a clear path to a production architecture.

## Future Direction

A full-stack version can replace the local seed module with:

- TimescaleDB time-travel queries for historical spatial snapshots
- Real parcel, zoning, business, mobility, and demographic datasets
- Live map tiles through MapLibre or another mapping engine
- A retrieval layer that assembles temporal and spatial evidence
- An LLM endpoint that returns cited, map-anchored explanations

## Current Status

This repository contains an interactive frontend demo. It does not yet connect to TimescaleDB, external map tiles, or a live model endpoint.
