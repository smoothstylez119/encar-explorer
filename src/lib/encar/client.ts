import { env } from "@/lib/env";
import type {
  EncarINavResponse,
  EncarSearchResponse,
  EncarVehicleDetail,
} from "@/lib/encar/types";

const ENCAR_API_BASE = "https://api.encar.com";
const ALL_CATALOG_QUERY = "(And.Hidden.N._.CarType.A.)";

const jsonHeaders = {
  Accept: "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
};

export interface SearchOptions {
  query?: string;
  sort?: string;
  offset?: number;
  limit?: number;
}

export async function encarFetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: jsonHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Encar API error ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

export function buildSearchUrl(options: SearchOptions = {}) {
  const query = options.query ?? ALL_CATALOG_QUERY;
  const sort = options.sort ?? "ModifiedDate";
  const offset = options.offset ?? 0;
  const limit = options.limit ?? env.defaultPageSize;

  const params = new URLSearchParams({
    count: "true",
    q: query,
    sr: `|${sort}|${offset}|${limit}`,
  });

  return `${ENCAR_API_BASE}/search/car/list/general?${params.toString()}`;
}

export async function fetchCatalogPage(options: SearchOptions = {}) {
  const url = buildSearchUrl(options);
  const response = await encarFetchJson<EncarSearchResponse>(url);

  return {
    offset: options.offset ?? 0,
    limit: options.limit ?? env.defaultPageSize,
    total: response.Count,
    results: response.SearchResults,
  };
}

export async function fetchCatalogFacets(query = ALL_CATALOG_QUERY) {
  const params = new URLSearchParams({
    count: "false",
    q: query,
    inav: "|Metadata|Sort",
  });

  return encarFetchJson<EncarINavResponse>(
    `${ENCAR_API_BASE}/search/car/list/general?${params.toString()}`,
  );
}

export async function fetchVehicleDetail(vehicleId: number | string) {
  return encarFetchJson<EncarVehicleDetail>(
    `${ENCAR_API_BASE}/v1/readside/vehicle/${vehicleId}`,
  );
}

export function getPublicVehicleUrl(vehicleId: number | string) {
  return `https://fem.encar.com/cars/detail/${vehicleId}`;
}

export function getImageUrl(path: string) {
  return path.startsWith("http") ? path : `https://ci.encar.com${path}`;
}

export function getAllCatalogQuery() {
  return ALL_CATALOG_QUERY;
}
