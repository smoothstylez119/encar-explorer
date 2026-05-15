# Encar Explorer Claude Notes

`AGENTS.md` is the primary handoff file for this project.

Read order:

1. `README.md`
2. `AGENTS.md`
3. `ARCHITECTURE.md`
4. `CHANGELOG.md`
5. `src/lib/db.ts`
6. `src/lib/sync.ts`
7. `src/lib/encar/client.ts`

Key reminder:

- Keep the UI backed by local SQLite.
- Use Encar only from server-side sync and hydration paths.
- Prefer minimal correct changes.
- Update the docs when behavior or workflows change.
