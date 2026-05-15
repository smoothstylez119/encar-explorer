import fs from "node:fs";
import path from "node:path";
import { fetchExchangeRates } from "@/lib/currency";
import {
  fetchCatalogFacets,
  fetchCatalogPage,
  fetchVehicleDetail,
} from "@/lib/encar/client";
import { env } from "@/lib/env";
import {
  createSyncRun,
  finishSyncRun,
  getVehicleById,
  getLatestExchangeRates,
  getSetting,
  listImagesForCaching,
  listVehicleIdsMissingDetails,
  markImageCached,
  saveExchangeRates,
  saveFacetSnapshot,
  setSetting,
  upsertSearchVehicles,
  upsertVehicleDetail,
} from "@/lib/db";
import { ensureDataDirs } from "@/lib/fs";
import {
  normalizeSearchVehicle,
  normalizeVehicleDetail,
} from "@/lib/normalize/vehicle";
import { translateTextToGerman } from "@/lib/translate/text";

interface CatalogSyncOptions {
  startPage?: number;
  maxPages?: number;
  pageSize?: number;
  sort?: string;
}

interface DetailSyncOptions {
  limit?: number;
  force?: boolean;
}

interface DetailHydrationOptions {
  trackRun?: boolean;
}

interface ImageCacheOptions {
  limit?: number;
  vehicleId?: number;
}

async function downloadFile(url: string, filePath: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
}

async function fetchVehicleDetailWithRetry(vehicleId: number, attempts = 3) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchVehicleDetail(vehicleId);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }

  throw lastError;
}

export async function ensureExchangeRates() {
  const latest = getLatestExchangeRates("KRW");
  const today = new Date().toISOString().slice(0, 10);

  if (latest?.date === today && latest.rates.EUR) {
    return latest;
  }

  const fresh = await fetchExchangeRates("KRW");
  saveExchangeRates(fresh.base, fresh.date, fresh.rates);

  return {
    base: fresh.base,
    date: fresh.date,
    fetchedAt: new Date().toISOString(),
    rates: fresh.rates,
  };
}

export async function syncCatalogBatch(options: CatalogSyncOptions = {}) {
  const startPage = Math.max(options.startPage ?? 1, 1);
  const maxPages = Math.max(options.maxPages ?? 1, 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 100, 1), 200);
  const sort = options.sort ?? "ModifiedDate";
  const runId = createSyncRun("catalog");

  try {
    const rates = await ensureExchangeRates();
    const eurRate = rates.rates.EUR ?? null;

    if (!getSetting("facets_initialized")) {
      const facets = await fetchCatalogFacets();
      saveFacetSnapshot("all-catalog", facets);
      setSetting("facets_initialized", "1");
    }

    let processed = 0;
    let total = 0;

    for (let page = startPage; page < startPage + maxPages; page += 1) {
      const offset = (page - 1) * pageSize;
      const result = await fetchCatalogPage({ offset, limit: pageSize, sort });
      total = result.total;

      const normalized = result.results.map((row) => normalizeSearchVehicle(row, eurRate));
      upsertSearchVehicles(normalized, result.results);

      processed += result.results.length;
      setSetting("catalog_last_page", String(page));
      setSetting("catalog_total_available", String(total));

      if (result.results.length < pageSize) {
        break;
      }
    }

    finishSyncRun(runId, true, processed, `Catalog batch synced. Total available: ${total}.`);

    return {
      success: true,
      processed,
      total,
      startPage,
      maxPages,
      pageSize,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finishSyncRun(runId, false, 0, message);
    throw error;
  }
}

export async function hydrateVehicleDetailsBatch(options: DetailSyncOptions = {}) {
  const limit = Math.max(options.limit ?? 30, 1);
  const runId = createSyncRun("details");

  try {
    const rates = await ensureExchangeRates();
    const eurRate = rates.rates.EUR ?? null;
    const ids = listVehicleIdsMissingDetails(limit, options.force ?? false);

    let processed = 0;
    for (const id of ids) {
      const detail = await fetchVehicleDetailWithRetry(id);
      const translatedDescription = await translateTextToGerman(
        String(detail.contents?.text ?? ""),
      );
      const normalized = normalizeVehicleDetail(detail, eurRate, id);
      normalized.descriptionDe = translatedDescription || normalized.descriptionDe;

      const images = (detail.photos ?? []).map((photo, index) => ({
        ordering: Number(photo.code || index + 1),
        sourceUrl: photo.path.startsWith("http") ? photo.path : `https://ci.encar.com${photo.path}`,
        type: photo.type,
        caption: photo.desc ?? "",
      }));

      upsertVehicleDetail(normalized, detail, images);
      processed += 1;
    }

    finishSyncRun(runId, true, processed, `Hydrated ${processed} detail records.`);
    return {
      success: true,
      processed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finishSyncRun(runId, false, 0, message);
    throw error;
  }
}

export async function hydrateVehicleDetailById(
  vehicleId: number,
  options: DetailHydrationOptions = {},
) {
  const trackRun = options.trackRun ?? false;
  const runId = trackRun ? createSyncRun("detail-single") : null;

  try {
    const rates = await ensureExchangeRates();
    const eurRate = rates.rates.EUR ?? null;
    const detail = await fetchVehicleDetailWithRetry(vehicleId);
    const translatedDescription = await translateTextToGerman(
      String(detail.contents?.text ?? ""),
    );
    const normalized = normalizeVehicleDetail(detail, eurRate, vehicleId);
    normalized.descriptionDe = translatedDescription || normalized.descriptionDe;

    const images = (detail.photos ?? []).map((photo, index) => ({
      ordering: Number(photo.code || index + 1),
      sourceUrl: photo.path.startsWith("http") ? photo.path : `https://ci.encar.com${photo.path}`,
      type: photo.type,
      caption: photo.desc ?? "",
    }));

    upsertVehicleDetail(normalized, detail, images);

    if (runId != null) {
      finishSyncRun(runId, true, 1, `Hydrated vehicle ${vehicleId}.`);
    }

    return normalized;
  } catch (error) {
    if (runId != null) {
      const message = error instanceof Error ? error.message : String(error);
      finishSyncRun(runId, false, 0, message);
    }
    throw error;
  }
}

export async function ensureVehicleDetailAvailable(vehicleId: number) {
  let vehicle = getVehicleById(vehicleId);
  if (!vehicle) return null;

  const needsHydration =
    !vehicle.hydratedAt ||
    !vehicle.descriptionDe ||
    vehicle.images.length === 0 ||
    !vehicle.contactPhone;

  if (!needsHydration) {
    return vehicle;
  }

  try {
    await hydrateVehicleDetailById(vehicleId, { trackRun: false });
  } catch {
    return getVehicleById(vehicleId);
  }

  vehicle = getVehicleById(vehicleId);
  return vehicle;
}

export async function cacheVehicleImagesBatch(options: ImageCacheOptions = {}) {
  ensureDataDirs();
  const limit = Math.max(options.limit ?? 100, 1);
  const runId = createSyncRun("images");

  try {
    const images = listImagesForCaching(limit, options.vehicleId);
    let processed = 0;

    for (const image of images) {
      const url = image.sourceUrl;
      const filename = path.basename(new URL(url).pathname);
      const directory = path.join(env.imageCacheDir, String(image.vehicleId));
      fs.mkdirSync(directory, { recursive: true });
      const localPath = path.join(directory, filename);

      if (!fs.existsSync(localPath)) {
        await downloadFile(url, localPath);
      }

      markImageCached(image.id, localPath);
      processed += 1;
    }

    finishSyncRun(runId, true, processed, `Cached ${processed} images.`);
    return {
      success: true,
      processed,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    finishSyncRun(runId, false, 0, message);
    throw error;
  }
}
