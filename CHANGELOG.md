# Changelog

## Unreleased

### Added

- Initial standalone Next.js app for exploring locally synchronized Encar inventory.
- Local SQLite schema for search rows, hydrated vehicle details, image manifests, exchange rates, facet snapshots, settings, and sync run tracking.
- Server-side Encar catalog and detail clients.
- CLI sync scripts for catalog import, detail hydration, image caching, and stats output.
- Dashboard, vehicle list, vehicle detail page, and local app API routes.
- Manual German translation dictionaries for structured Encar fields.
- KRW to EUR conversion using cached exchange rates.
- Image proxy/cache route for locally cached vehicle photos.
- Central `AGENTS.md` handoff guide and this project changelog.

### Changed

- Vehicle detail reads now use on-demand hydration when critical local detail data is missing.
- Documentation now treats `AGENTS.md` as the primary agent handoff file.

### Fixed

- SQLite transaction handling was changed to explicit `BEGIN` and `COMMIT` flow after `db.transaction` proved unavailable in the current runtime.
- SQLite lock handling was improved with `PRAGMA busy_timeout = 5000`.
- Detail hydration now stores records under the requested local search ID to avoid broken lookups when Encar returns a different internal vehicle ID.
