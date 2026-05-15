import { FiltersForm } from "@/components/FiltersForm";
import { VehicleTable } from "@/components/VehicleTable";
import { getDashboardStats, getFilterOptions, queryVehicles } from "@/lib/db";

function toNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBool(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  return raw === "1" || raw === "true";
}

export default async function VehiclesPage(props: PageProps<'/vehicles'>) {
  const searchParams = await props.searchParams;
  const filters = getFilterOptions();
  const stats = getDashboardStats();

  const result = queryVehicles({
    q: Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q,
    manufacturer: Array.isArray(searchParams.manufacturer)
      ? searchParams.manufacturer[0]
      : searchParams.manufacturer,
    model: Array.isArray(searchParams.model) ? searchParams.model[0] : searchParams.model,
    fuel: Array.isArray(searchParams.fuel) ? searchParams.fuel[0] : searchParams.fuel,
    city: Array.isArray(searchParams.city) ? searchParams.city[0] : searchParams.city,
    sellType: Array.isArray(searchParams.sellType) ? searchParams.sellType[0] : searchParams.sellType,
    minPriceEur: toNumber(searchParams.minPriceEur),
    maxPriceEur: toNumber(searchParams.maxPriceEur),
    minMileage: toNumber(searchParams.minMileage),
    maxMileage: toNumber(searchParams.maxMileage),
    minYear: toNumber(searchParams.minYear),
    maxYear: toNumber(searchParams.maxYear),
    hasDetails: toBool(searchParams.hasDetails),
    hasCachedImages: toBool(searchParams.hasCachedImages),
    hasVin: toBool(searchParams.hasVin),
    sort: Array.isArray(searchParams.sort) ? searchParams.sort[0] : searchParams.sort,
    page: toNumber(searchParams.page) ?? 1,
    pageSize: 40,
  });

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" && value !== "") {
      query.set(key, value);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">Fahrzeuge durchsuchen</h1>
        <p className="mt-2 text-sm text-muted">
          Eigene Filter ueber dem lokal synchronisierten Encar-Katalog mit deutscher Aufbereitung und EUR-Preisen.
        </p>
        <p className="mt-2 text-sm text-amber-200">
          Aktuell sichtbar: {new Intl.NumberFormat("de-DE").format(result.total)} lokal gespeicherte Fahrzeuge von insgesamt {new Intl.NumberFormat("de-DE").format(stats.totalAvailable)} aktiven Encar-Inseraten.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <FiltersForm filters={filters} current={searchParams} />

        <VehicleTable
          vehicles={result.items}
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          currentQuery={query}
        />
      </div>
    </main>
  );
}
