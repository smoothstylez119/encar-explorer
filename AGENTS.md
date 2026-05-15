# Encar Explorer Agent Guide

This file is the central handoff and operating guide for AI agents and developers working in `websites/encar-explorer`.

## Read Order

Read these files before making changes:

1. `README.md`
2. `AGENTS.md`
3. `ARCHITECTURE.md`
4. `CHANGELOG.md`
5. `src/lib/db.ts`
6. `src/lib/sync.ts`
7. `src/lib/encar/client.ts`

## Project Intent

This app is a local explorer for Encar inventory data.

- The UI reads from the local SQLite database.
- Encar is only contacted server-side for sync and hydration flows.
- The app intentionally shows only the locally synchronized subset of the full Encar catalog.
- German presentation is part of the product, not a thin UI afterthought.

## Core Rules

1. Do not introduce direct client-side requests to Encar.
2. Keep the local DB as the system of record for rendered UI data.
3. Prefer small, direct changes over new abstraction layers.
4. Be conservative with SQLite write concurrency.
5. Update docs when behavior, schema, commands, or workflows change.

## Mental Model

There are three distinct data layers:

- `vehicles_search`: local searchable catalog rows from Encar list results
- `vehicle_details`: hydrated per-vehicle detail data
- `vehicle_images`: image manifest rows plus optional local cache paths

Important consequences:

- A list row can exist without detail hydration.
- Detail pages may trigger on-demand hydration when important detail data is missing.
- Encar search IDs and detail payload IDs do not always match.
- The current implementation stores hydrated detail data under the requested local search ID on purpose.

## Main Flow

1. `sync:catalog` pulls Encar search pages and upserts `vehicles_search`.
2. `sync:details` hydrates missing rows into `vehicle_details` and `vehicle_images`.
3. `sync:images` downloads selected source images into `data/images/` and stores cache paths.
4. `ensureVehicleDetailAvailable()` is the runtime fallback used by the app when a detail page is opened before background hydration ran.

## Important Files

- `src/lib/db.ts`: SQLite schema, queries, upserts, stats, filter options
- `src/lib/sync.ts`: catalog sync, detail hydration, image caching, on-demand detail fetch path
- `src/lib/encar/client.ts`: Encar HTTP endpoints and request builders
- `src/lib/normalize/vehicle.ts`: normalization for search and detail payloads
- `src/lib/translate/dictionaries.ts`: manual German dictionaries for structured fields
- `src/lib/translate/text.ts`: optional free-text translation path
- `src/app/api/vehicles/[id]/route.ts`: API route that guarantees detail availability before returning a record
- `src/app/vehicles/[id]/page.tsx`: server page that uses the same detail-availability flow

## Safe Change Patterns

### New searchable field

1. Normalize it in `src/lib/normalize/vehicle.ts`.
2. Persist it in `src/lib/db.ts`.
3. Expose it in list/detail queries.
4. Render it in the relevant UI.
5. Document it if it changes behavior or setup.

### New sync behavior

1. Add the Encar fetch helper in `src/lib/encar/` or `src/lib/encar/client.ts`.
2. Wire it through `src/lib/sync.ts`.
3. Store only normalized data needed by the UI or future sync steps.
4. Keep network access server-side.

### New translation behavior

1. Prefer deterministic dictionary mappings for structured fields.
2. Use external translation providers only for free text.
3. Keep the app usable without API keys.

## Current Constraints

- Local runtime data lives in `data/` and is ignored by git by default.
- `node:sqlite` is used directly; there is no ORM.
- Exchange rates are cached locally.
- The app is optimized for partial local mirrors, not for requiring a full 200k+ vehicle import before being useful.

## Documentation Rules

Update the docs in the same change when any of the following changes:

- setup or environment variables
- CLI commands or sync workflows
- DB schema or stored meaning of fields
- runtime behavior of hydration, caching, or translation
- agent/developer handoff expectations

At minimum, keep these files current:

- `README.md` for user/developer usage
- `ARCHITECTURE.md` for system structure and data flow
- `CHANGELOG.md` for notable project changes
- `AGENTS.md` for future handoff and implementation constraints

## Working Agreement For Future Agents

- Start by reading, not guessing.
- Preserve the local-first architecture.
- Treat unexpected worktree changes as user work unless proven otherwise.
- Do not remove local data paths from `.gitignore` unless the user explicitly wants data committed.
- Leave a clear trail in docs when you change behavior.
