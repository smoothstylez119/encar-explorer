import Link from "next/link";
import { compactDate, formatInteger } from "@/components/format";
import { SyncActions } from "@/components/SyncActions";
import { getDashboardStats, getRecentSyncRuns } from "@/lib/db";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-3xl border border-border bg-panel p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export default function HomePage() {
  const stats = getDashboardStats();
  const syncRuns = getRecentSyncRuns(8);
  const eurRate = stats.latestRates?.rates?.EUR ?? null;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[2rem] border border-border bg-[radial-gradient(circle_at_top_left,rgba(142,181,255,0.22),transparent_45%),linear-gradient(180deg,#101833_0%,#0b1020_100%)] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)] lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="inline-flex rounded-full border border-border bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.25em] text-accent">
            Encar Explorer
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Eigene Web-App fuer den gesamten aktiven Encar-Katalog.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
            Die App zieht Encar-Daten serverseitig ueber die oeffentlichen Endpunkte, speichert sie lokal in
            SQLite, uebersetzt so gut wie moeglich nach Deutsch und zeigt Preise zusaetzlich in Euro an.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/vehicles"
              className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong"
            >
              Fahrzeuge durchsuchen
            </Link>
            <a
              href="/api/stats"
              className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-white transition hover:bg-panel-strong"
              target="_blank"
              rel="noreferrer"
            >
              API-Status JSON
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Lokale Fahrzeuge"
            value={formatInteger(stats.vehicles)}
            hint={`Von aktuell ${formatInteger(stats.totalAvailable)} aktiven Encar-Inseraten.`}
          />
          <StatCard label="Detaildaten" value={formatInteger(stats.details)} hint="Hydrierte Detail-API-Datensaetze." />
          <StatCard label="Bild-Records" value={formatInteger(stats.images)} hint={`${formatInteger(stats.cachedImages)} lokal gecacht.`} />
          <StatCard
            label="KRW -> EUR"
            value={eurRate ? eurRate.toFixed(6) : "-"}
            hint={stats.latestRates ? `Stand ${stats.latestRates.date}` : "Noch kein Wechselkurs gespeichert."}
          />
        </div>
      </section>

      <SyncActions />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border bg-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Empfohlener Start</h2>
              <p className="mt-1 text-sm text-muted">
                Der Vollkatalog ist gross. Deswegen ist die App so gebaut, dass du schrittweise syncen kannst und sie
                trotzdem sofort nutzbar bleibt.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-panel-strong p-4">
              <div className="text-sm font-semibold text-white">1. Katalog laden</div>
              <p className="mt-2 text-sm leading-7 text-muted">
                Zuerst einige Seiten des Gesamtkatalogs in die lokale DB ziehen. Danach steht die Suchoberflaeche schon.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-panel-strong p-4">
              <div className="text-sm font-semibold text-white">2. Details nachziehen</div>
              <p className="mt-2 text-sm leading-7 text-muted">
                Pro Fahrzeug werden Beschreibung, VIN, Bilder, Optionen, Haendler und weitere Zustandsdaten hydriert.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-panel-strong p-4">
              <div className="text-sm font-semibold text-white">3. Bilder cachen</div>
              <p className="mt-2 text-sm leading-7 text-muted">
                Die Bild-Manifestdaten sind komplett in der DB. Lokales Caching passiert batchweise oder beim Bedarf.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-panel p-5">
          <h2 className="text-lg font-semibold text-white">Letzte Sync-Runs</h2>
          <div className="mt-4 space-y-3">
            {syncRuns.length ? (
              syncRuns.map((run) => (
                <div key={String(run.id)} className="rounded-2xl border border-border bg-panel-strong p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">{String(run.type)}</span>
                    <span className={`text-xs ${Number(run.success) ? "text-accent" : "text-danger"}`}>
                      {Number(run.success) ? "ok" : "fehler"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted">
                    gestartet: {compactDate(String(run.started_at))}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    verarbeitet: {formatInteger(Number(run.processed_count ?? 0))}
                  </div>
                  <div className="mt-2 text-xs text-muted">{String(run.message ?? "")}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-border bg-panel-strong p-4 text-sm text-muted">
                Noch keine Sync-Runs vorhanden.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
