# Architecture

## Purpose

`encar-explorer` is a standalone Next.js app that builds a local, German-friendly explorer on top of Encar's public vehicle APIs.

The system is deliberately split between:

- server-side sync and hydration against Encar
- local SQLite persistence
- UI rendering only from local state

That split keeps the frontend stable, testable, and explicit about only showing synchronized local data.

## High-Level Components

### Next.js app

- App Router pages under `src/app/`
- API routes under `src/app/api/`
- server-rendered detail and list pages

### Local persistence

- SQLite database at `data/encar-explorer.sqlite`
- image cache under `data/images/`
- optional export directory under `data/exports/`

### Encar integration

- catalog list endpoint in `src/lib/encar/client.ts`
- vehicle detail endpoint in `src/lib/encar/client.ts`
- normalization in `src/lib/normalize/vehicle.ts`

### Translation and currency

- manual structured dictionaries in `src/lib/translate/dictionaries.ts`
- optional free-text translation in `src/lib/translate/text.ts`
- KRW to EUR exchange-rate caching in `src/lib/currency.ts`

## Data Model

### `vehicles_search`

Stores list/search level data for each locally known vehicle.

Used by:

- dashboard counts
- filter options
- vehicle list queries
- base record lookup before detail hydration

### `vehicle_details`

Stores hydrated detail data for a vehicle.

Includes fields such as:

- VIN and vehicle number
- contact and dealer information
- body, transmission, color
- original price
- free-text descriptions

### `vehicle_images`

Stores image metadata and optional local cache path.

The image pipeline is intentionally two-phase:

1. detail hydration stores manifest entries and source URLs
2. image caching downloads selected files later

### Supporting tables

- `exchange_rates`
- `facet_snapshots`
- `sync_runs`
- `settings`

## Sync Pipeline

## Catalog sync

Entry point: `syncCatalogBatch()` in `src/lib/sync.ts`

Flow:

1. Ensure exchange rates are available.
2. Fetch catalog facets once and cache them.
3. Pull Encar catalog pages in batches.
4. Normalize search rows.
5. Upsert into `vehicles_search`.
6. Persist sync metadata in `settings` and `sync_runs`.

## Detail hydration

Entry points:

- `hydrateVehicleDetailsBatch()`
- `hydrateVehicleDetailById()`

Flow:

1. Select vehicles missing detail data.
2. Fetch detail payload with retry.
3. Translate free text when configured.
4. Normalize the payload.
5. Upsert detail row and image manifest rows.

Important implementation detail:

The normalized detail is currently stored under the requested search ID, even when Encar returns a different internal `vehicleId`. This avoids orphaned detail rows relative to the local catalog entry.

## On-demand detail availability

Entry point: `ensureVehicleDetailAvailable()`

Used by:

- `src/app/vehicles/[id]/page.tsx`
- `src/app/api/vehicles/[id]/route.ts`

Decision rule:

Hydration is attempted when one of the following is missing:

- `hydratedAt`
- `descriptionDe`
- images
- `contactPhone`

If hydration fails, the app falls back to the best locally available record instead of failing hard for every partial vehicle.

## Image caching

Entry point: `cacheVehicleImagesBatch()`

Flow:

1. Select uncached image rows.
2. Download to `data/images/<vehicleId>/`.
3. Store cache path in `vehicle_images`.

The app can function without the full image cache because source URLs are already known after detail hydration.

## Runtime Request Model

### Vehicle list page

Reads local list/filter data from SQLite. No direct browser call to Encar should be introduced here.

### Vehicle detail page

Requests a local record and may trigger server-side detail hydration when the local detail layer is incomplete.

### Stats and sync routes

Operate as local control surfaces over the sync pipeline.

## Operational Notes

- SQLite writes should stay conservative to avoid lock contention.
- Sync jobs are better run in modest batches than with aggressive parallelism.
- The app is intentionally useful with partial data, which is why hydration and image caching are split from the catalog import.
- `.gitignore` currently keeps local data, images, and exports out of version control.
