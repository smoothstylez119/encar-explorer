import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-full border border-border bg-panel px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent">
        404
      </div>
      <h1 className="mt-6 text-4xl font-semibold text-white">Seite nicht gefunden</h1>
      <p className="mt-3 text-sm leading-7 text-muted">
        Die angeforderte Route oder Fahrzeug-ID existiert in der lokalen Explorer-Datenbank aktuell nicht.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-slate-950">
          Dashboard
        </Link>
        <Link href="/vehicles" className="rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-white">
          Fahrzeugliste
        </Link>
      </div>
    </main>
  );
}
