import Image from "next/image";
import Link from "next/link";
import { formatEuro, formatInteger, formatKrw, formatYearMonth } from "@/components/format";

interface VehicleRow {
  vehicleId: number;
  publicUrl: string;
  manufacturer: string;
  manufacturerDe: string;
  model: string;
  modelDe: string;
  badge: string;
  badgeDe: string;
  fuelDe: string;
  yearMonth: number | null;
  modelYear: string;
  mileageKm: number | null;
  priceKrw: number | null;
  priceEur: number | null;
  sellTypeDe: string;
  city: string;
  dealerName: string;
  trustDe: string[];
  serviceMarkDe: string[];
  thumbUrl: string;
  summaryDe: string;
  hasDetails: boolean;
  hasCachedImages: boolean;
}

interface VehicleTableProps {
  vehicles: VehicleRow[];
  page: number;
  pageSize: number;
  total: number;
  currentQuery: URLSearchParams;
}

function pageLink(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  return `/vehicles?${params.toString()}`;
}

export function VehicleTable({
  vehicles,
  page,
  pageSize,
  total,
  currentQuery,
}: VehicleTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="rounded-3xl border border-border bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-2 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Fahrzeugliste</h2>
          <p className="mt-1 text-sm text-muted">
            {new Intl.NumberFormat("de-DE").format(total)} Treffer in der lokalen DB, nicht im kompletten Encar-Katalog.
          </p>
        </div>
        <div className="text-sm text-muted">
          Seite {page} / {totalPages}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto scrollbar-thin">
        <table className="min-w-full border-separate border-spacing-y-3 text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3">Fahrzeug</th>
              <th className="px-3">Preis</th>
              <th className="px-3">Daten</th>
              <th className="px-3">Ort</th>
              <th className="px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.vehicleId} className="align-top">
                <td className="rounded-l-2xl border border-r-0 border-border bg-panel-strong px-3 py-3">
                  <div className="flex min-w-[320px] gap-3">
                    <div className="relative h-24 w-36 overflow-hidden rounded-2xl border border-border bg-black/20">
                      {vehicle.thumbUrl ? (
                        <Image
                          src={vehicle.thumbUrl}
                          alt={`${vehicle.manufacturer} ${vehicle.model} ${vehicle.badge}`}
                          fill
                          sizes="144px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/vehicles/${vehicle.vehicleId}`}
                          className="font-semibold text-white hover:text-accent"
                        >
                          {vehicle.manufacturerDe} {vehicle.modelDe} {vehicle.badgeDe}
                        </Link>
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                          ID {vehicle.vehicleId}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        Original: {vehicle.manufacturer} {vehicle.model} {vehicle.badge}
                      </div>
                      <p className="mt-2 line-clamp-2 text-muted">{vehicle.summaryDe}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                        {vehicle.serviceMarkDe.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-black/20 px-2 py-1">
                            {tag}
                          </span>
                        ))}
                        {vehicle.trustDe.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded-full bg-black/20 px-2 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="border border-x-0 border-border bg-panel-strong px-3 py-3">
                  <div className="font-semibold text-white">{formatEuro(vehicle.priceEur)}</div>
                  <div className="mt-1 text-xs text-muted">{formatKrw(vehicle.priceKrw)}</div>
                </td>

                <td className="border border-x-0 border-border bg-panel-strong px-3 py-3 text-muted">
                  <div>{vehicle.fuelDe}</div>
                  <div>{formatYearMonth(vehicle.yearMonth)}</div>
                  <div>{formatInteger(vehicle.mileageKm)} km</div>
                  <div>{vehicle.sellTypeDe}</div>
                </td>

                <td className="border border-x-0 border-border bg-panel-strong px-3 py-3 text-muted">
                  <div>{vehicle.city}</div>
                  <div className="mt-1">{vehicle.dealerName || "-"}</div>
                </td>

                <td className="rounded-r-2xl border border-l-0 border-border bg-panel-strong px-3 py-3">
                  <div className="flex flex-col gap-2 text-xs text-muted">
                    <span>{vehicle.hasDetails ? "Detaildaten vorhanden" : "Nur Suchdaten"}</span>
                    <span>{vehicle.hasCachedImages ? "Bilder lokal gecacht" : "Bilder remote"}</span>
                    <a
                      href={vehicle.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:text-accent-strong"
                    >
                      Original-Inserat
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="text-sm text-muted">
          {vehicles.length} Fahrzeuge auf dieser Seite
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={page > 1 ? pageLink(currentQuery, page - 1) : "#"}
            className={`rounded-xl border border-border px-3 py-2 ${page > 1 ? "hover:bg-panel-strong" : "pointer-events-none opacity-40"}`}
          >
            Zurueck
          </Link>
          <Link
            href={page < totalPages ? pageLink(currentQuery, page + 1) : "#"}
            className={`rounded-xl border border-border px-3 py-2 ${page < totalPages ? "hover:bg-panel-strong" : "pointer-events-none opacity-40"}`}
          >
            Weiter
          </Link>
        </div>
      </div>
    </div>
  );
}
