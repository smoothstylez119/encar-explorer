import { queryVehicles } from "@/lib/db";
import { jsonOk } from "@/lib/http";

function parseNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseBoolean(value: string | null) {
  if (!value) return undefined;
  return value === "1" || value === "true";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams;

  const result = queryVehicles({
    q: search.get("q") ?? undefined,
    manufacturer: search.get("manufacturer") ?? undefined,
    model: search.get("model") ?? undefined,
    fuel: search.get("fuel") ?? undefined,
    city: search.get("city") ?? undefined,
    sellType: search.get("sellType") ?? undefined,
    minPriceEur: parseNumber(search.get("minPriceEur")),
    maxPriceEur: parseNumber(search.get("maxPriceEur")),
    minMileage: parseNumber(search.get("minMileage")),
    maxMileage: parseNumber(search.get("maxMileage")),
    minYear: parseNumber(search.get("minYear")),
    maxYear: parseNumber(search.get("maxYear")),
    hasDetails: parseBoolean(search.get("hasDetails")),
    hasCachedImages: parseBoolean(search.get("hasCachedImages")),
    hasVin: parseBoolean(search.get("hasVin")),
    page: parseNumber(search.get("page")),
    pageSize: parseNumber(search.get("pageSize")),
    sort: search.get("sort") ?? undefined,
  });

  return jsonOk(result);
}
