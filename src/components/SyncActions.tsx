"use client";

import { useState, useTransition } from "react";

type SyncKind = "catalog" | "details" | "images";

async function postJson(path: string, body: object) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(json.error || `Request failed: ${response.status}`);
  }

  return json;
}

export function SyncActions() {
  const [catalogPages, setCatalogPages] = useState(5);
  const [detailLimit, setDetailLimit] = useState(20);
  const [imageLimit, setImageLimit] = useState(50);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function run(kind: SyncKind) {
    startTransition(async () => {
      try {
        setMessage("");

        if (kind === "catalog") {
          const json = await postJson("/api/sync/catalog", {
            startPage: 1,
            maxPages: catalogPages,
            pageSize: 100,
          });
          setMessage(`Katalog-Sync fertig: ${(json as { processed?: number }).processed ?? 0} Datensaetze.`);
          return;
        }

        if (kind === "details") {
          const json = await postJson("/api/sync/details", {
            limit: detailLimit,
          });
          setMessage(`Detail-Hydration fertig: ${(json as { processed?: number }).processed ?? 0} Fahrzeuge.`);
          return;
        }

        const json = await postJson("/api/sync/images", {
          limit: imageLimit,
        });
        setMessage(`Bild-Cache fertig: ${(json as { processed?: number }).processed ?? 0} Bilder.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      }
    });
  }

  return (
    <section className="rounded-3xl border border-border bg-panel p-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Sync-Steuerung</h2>
          <p className="mt-1 text-sm text-muted">
            Der schnelle MVP laedt den Katalog batchweise, hydriert Details nach und cached Bilder lokal.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel-strong p-4">
            <label className="text-sm font-medium text-white">Katalogseiten</label>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none"
              type="number"
              min={1}
              value={catalogPages}
              onChange={(event) => setCatalogPages(Number(event.target.value) || 1)}
            />
            <button
              className="mt-3 w-full rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-60"
              onClick={() => run("catalog")}
              disabled={pending}
            >
              Katalog syncen
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-panel-strong p-4">
            <label className="text-sm font-medium text-white">Detail-Hydration</label>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none"
              type="number"
              min={1}
              value={detailLimit}
              onChange={(event) => setDetailLimit(Number(event.target.value) || 1)}
            />
            <button
              className="mt-3 w-full rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-60"
              onClick={() => run("details")}
              disabled={pending}
            >
              Details laden
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-panel-strong p-4">
            <label className="text-sm font-medium text-white">Bild-Cache</label>
            <input
              className="mt-2 w-full rounded-xl border border-border bg-black/20 px-3 py-2 text-sm outline-none"
              type="number"
              min={1}
              value={imageLimit}
              onChange={(event) => setImageLimit(Number(event.target.value) || 1)}
            />
            <button
              className="mt-3 w-full rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong disabled:opacity-60"
              onClick={() => run("images")}
              disabled={pending}
            >
              Bilder cachen
            </button>
          </div>
        </div>

        <div className="min-h-6 text-sm text-muted">{message}</div>
      </div>
    </section>
  );
}
