import Link from "next/link";

type SearchParamsLike = Record<string, string | string[] | undefined>;

interface FilterOption {
  value: string;
  count: number;
  label?: string;
}

interface FiltersData {
  manufacturers: FilterOption[];
  models: FilterOption[];
  fuels: FilterOption[];
  cities: FilterOption[];
  sellTypes: FilterOption[];
}

interface FiltersFormProps {
  filters: FiltersData;
  current: SearchParamsLike;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function optionLabel(option: FilterOption) {
  const label = option.label || option.value;
  return `${label} (${new Intl.NumberFormat("de-DE").format(option.count)})`;
}

function SelectField({
  name,
  label,
  options,
  value,
}: {
  name: string;
  label: string;
  options: FilterOption[];
  value: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="rounded-xl border border-border bg-black/20 px-3 py-2 text-white outline-none"
      >
        <option value="">Alle</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {optionLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputField({
  name,
  label,
  value,
  type = "text",
}: {
  name: string;
  label: string;
  value: string;
  type?: "text" | "number";
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value}
        className="rounded-xl border border-border bg-black/20 px-3 py-2 text-white outline-none"
      />
    </label>
  );
}

function CheckboxField({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-black/10 px-3 py-2 text-sm text-white">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}

export function FiltersForm({ filters, current }: FiltersFormProps) {
  const q = firstValue(current.q);
  const manufacturer = firstValue(current.manufacturer);
  const model = firstValue(current.model);
  const fuel = firstValue(current.fuel);
  const city = firstValue(current.city);
  const sellType = firstValue(current.sellType);
  const minPriceEur = firstValue(current.minPriceEur);
  const maxPriceEur = firstValue(current.maxPriceEur);
  const minMileage = firstValue(current.minMileage);
  const maxMileage = firstValue(current.maxMileage);
  const minYear = firstValue(current.minYear);
  const maxYear = firstValue(current.maxYear);
  const sort = firstValue(current.sort) || "latest";

  return (
    <form action="/vehicles" className="rounded-3xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Filter</h2>
        <Link href="/vehicles" className="text-sm text-accent hover:text-accent-strong">
          Zuruecksetzen
        </Link>
      </div>

      <div className="mt-4 grid gap-4">
        <InputField name="q" label="Suche" value={q} />

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            name="manufacturer"
            label="Hersteller"
            options={filters.manufacturers}
            value={manufacturer}
          />
          <SelectField name="model" label="Modell" options={filters.models} value={model} />
          <SelectField name="fuel" label="Kraftstoff" options={filters.fuels} value={fuel} />
          <SelectField name="city" label="Standort" options={filters.cities} value={city} />
          <SelectField
            name="sellType"
            label="Verkaufsart"
            options={filters.sellTypes}
            value={sellType}
          />
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-muted">Sortierung</span>
            <select
              name="sort"
              defaultValue={sort}
              className="rounded-xl border border-border bg-black/20 px-3 py-2 text-white outline-none"
            >
              <option value="latest">Neueste Syncs</option>
              <option value="priceAsc">Preis EUR aufsteigend</option>
              <option value="priceDesc">Preis EUR absteigend</option>
              <option value="mileageAsc">Kilometer aufsteigend</option>
              <option value="mileageDesc">Kilometer absteigend</option>
              <option value="yearDesc">Baujahr absteigend</option>
              <option value="yearAsc">Baujahr aufsteigend</option>
              <option value="eurPerKmAsc">EUR pro km</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField name="minPriceEur" label="Preis ab EUR" type="number" value={minPriceEur} />
          <InputField name="maxPriceEur" label="Preis bis EUR" type="number" value={maxPriceEur} />
          <InputField name="minMileage" label="km ab" type="number" value={minMileage} />
          <InputField name="maxMileage" label="km bis" type="number" value={maxMileage} />
          <InputField name="minYear" label="Baujahr ab" type="number" value={minYear} />
          <InputField name="maxYear" label="Baujahr bis" type="number" value={maxYear} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <CheckboxField name="hasDetails" label="Nur mit Detaildaten" checked={Boolean(current.hasDetails)} />
          <CheckboxField name="hasCachedImages" label="Nur mit lokalem Bildcache" checked={Boolean(current.hasCachedImages)} />
          <CheckboxField name="hasVin" label="Nur mit VIN" checked={Boolean(current.hasVin)} />
        </div>

        <input type="hidden" name="page" value="1" />

        <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong">
          Filter anwenden
        </button>
      </div>
    </form>
  );
}
