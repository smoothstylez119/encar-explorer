import Image from "next/image";
import Link from "next/link";
import { compactDate, formatEuro, formatInteger, formatKrw, formatYearMonth } from "@/components/format";

interface VehicleImage {
  ordering: number;
  sourceUrl: string;
  type: string;
  caption: string;
  cachePath: string | null;
}

interface VehicleDetailProps {
  vehicle: {
    vehicleId: number;
    publicUrl: string;
    manufacturer: string;
    model: string;
    badge: string;
    fuelDe: string;
    yearMonth: number | null;
    modelYear: string;
    mileageKm: number | null;
    priceKrw: number | null;
    priceEur: number | null;
    city: string;
    dealerName: string;
    officeName: string;
    vin: string;
    vehicleNo: string;
    bodyNameDe: string;
    displacementCc: number | null;
    transmissionDe: string;
    colorDe: string;
    seats: number | null;
    contactPhone: string;
    contactAddress: string;
    contactPerson: string;
    dealerFirm: string;
    originalPriceKrw: number | null;
    originalPriceEur: number | null;
    descriptionKo: string;
    descriptionDe: string;
    optionCodes: string[];
    inspectionFormats: string[];
    accidentRecordAvailable: boolean;
    seizingCount: number | null;
    pledgeCount: number | null;
    trustDe: string[];
    serviceMarkDe: string[];
    conditionsDe: string[];
    buyTypeDe: string[];
    hydratedAt: string;
    images: VehicleImage[];
  };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-panel-strong p-3">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-sm text-white">{value || "-"}</div>
    </div>
  );
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/vehicles" className="text-sm text-accent hover:text-accent-strong">
            Zurueck zur Liste
          </Link>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            {vehicle.manufacturer} {vehicle.model} {vehicle.badge}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Detailansicht fuer den lokalen Explorer. Letzte Hydration: {compactDate(vehicle.hydratedAt)}
          </p>
          <p className="mt-2 text-xs text-amber-200">
            Falls fuer dieses Fahrzeug noch keine lokalen Detaildaten vorlagen, wurden sie beim ersten Aufruf automatisch aus der Encar-Detail-API nachgezogen.
          </p>
        </div>
        <a
          href={vehicle.publicUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-accent-strong"
        >
          Original bei Encar
        </a>
      </div>

      <section className="rounded-3xl border border-border bg-panel p-4">
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {vehicle.images.slice(0, 12).map((image) => (
                <div key={`${image.sourceUrl}-${image.ordering}`} className="group overflow-hidden rounded-2xl border border-border bg-panel-strong">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={image.sourceUrl}
                      alt={`${vehicle.badge} Bild ${image.ordering}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="px-3 py-2 text-xs text-muted">
                    {image.type}
                    {image.cachePath ? " · lokal gecacht" : " · remote"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <Fact label="Preis EUR" value={formatEuro(vehicle.priceEur)} />
            <Fact label="Preis KRW" value={formatKrw(vehicle.priceKrw)} />
            <Fact label="Neupreis EUR" value={formatEuro(vehicle.originalPriceEur)} />
            <Fact label="Erstzulassung" value={formatYearMonth(vehicle.yearMonth)} />
            <Fact label="Modelljahr" value={vehicle.modelYear || "-"} />
            <Fact label="Laufleistung" value={`${formatInteger(vehicle.mileageKm)} km`} />
            <Fact label="Kraftstoff" value={vehicle.fuelDe} />
            <Fact label="Getriebe" value={vehicle.transmissionDe} />
            <Fact label="Hubraum" value={vehicle.displacementCc ? `${formatInteger(vehicle.displacementCc)} ccm` : "-"} />
            <Fact label="Farbe" value={vehicle.colorDe} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-border bg-panel p-5">
          <h2 className="text-lg font-semibold text-white">Beschreibung auf Deutsch</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{vehicle.descriptionDe || "Keine deutsche Beschreibung vorhanden."}</p>

          <h3 className="mt-8 text-base font-semibold text-white">Originaltext</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{vehicle.descriptionKo || "Kein Originaltext vorhanden."}</p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-panel p-5">
            <h2 className="text-lg font-semibold text-white">Kontakt und Fahrzeugdaten</h2>
            <div className="mt-4 grid gap-3">
              <Fact label="Standort" value={vehicle.city} />
              <Fact label="Haendler" value={vehicle.dealerFirm || vehicle.officeName || vehicle.dealerName} />
              <Fact label="Kontaktperson" value={vehicle.contactPerson || vehicle.dealerName} />
              <Fact label="Telefon" value={vehicle.contactPhone} />
              <Fact label="Adresse" value={vehicle.contactAddress} />
              <Fact label="VIN" value={vehicle.vin} />
              <Fact label="Kennzeichen" value={vehicle.vehicleNo} />
              <Fact label="Karosserie" value={vehicle.bodyNameDe} />
              <Fact label="Sitze" value={vehicle.seats ? String(vehicle.seats) : "-"} />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-panel p-5">
            <h2 className="text-lg font-semibold text-white">Merkmale</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
              {vehicle.trustDe.map((tag) => (
                <span key={tag} className="rounded-full bg-panel-strong px-3 py-1">{tag}</span>
              ))}
              {vehicle.serviceMarkDe.map((tag) => (
                <span key={tag} className="rounded-full bg-panel-strong px-3 py-1">{tag}</span>
              ))}
              {vehicle.conditionsDe.map((tag) => (
                <span key={tag} className="rounded-full bg-panel-strong px-3 py-1">{tag}</span>
              ))}
              {vehicle.buyTypeDe.map((tag) => (
                <span key={tag} className="rounded-full bg-panel-strong px-3 py-1">{tag}</span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-panel p-5">
            <h2 className="text-lg font-semibold text-white">Zustand und Optionen</h2>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              <div>Unfall-/Datensatzhinweis: {vehicle.accidentRecordAvailable ? "vorhanden" : "nicht angegeben"}</div>
              <div>Seizings: {vehicle.seizingCount ?? 0}</div>
              <div>Pledges: {vehicle.pledgeCount ?? 0}</div>
              <div>Inspektionsformate: {vehicle.inspectionFormats.join(", ") || "-"}</div>
              <div>Optionscodes: {vehicle.optionCodes.slice(0, 30).join(", ") || "-"}</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
