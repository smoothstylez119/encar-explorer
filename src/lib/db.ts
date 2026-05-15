import { DatabaseSync } from "node:sqlite";
import { ensureDataDirs } from "@/lib/fs";
import type {
  EncarINavResponse,
  EncarSearchResult,
  EncarVehicleDetail,
} from "@/lib/encar/types";
import type {
  NormalizedVehicle,
  NormalizedVehicleDetail,
} from "@/lib/normalize/vehicle";
import { env } from "@/lib/env";
import {
  translateLiteral,
  translateManufacturerName,
  translateModelName,
  translateRegionName,
} from "@/lib/translate/dictionaries";

declare global {
  var __encarExplorerDb: DatabaseSync | undefined;
}

function jsonStringify(value: unknown) {
  return JSON.stringify(value ?? null);
}

function jsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function runTransaction(db: DatabaseSync, callback: () => void) {
  db.exec("BEGIN");
  try {
    callback();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function createDatabase() {
  ensureDataDirs();

  const db = new DatabaseSync(env.dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      base TEXT NOT NULL,
      date TEXT NOT NULL,
      rates_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      PRIMARY KEY (base, date)
    );

    CREATE TABLE IF NOT EXISTS facet_snapshots (
      query_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      processed_count INTEGER NOT NULL DEFAULT 0,
      message TEXT
    );

    CREATE TABLE IF NOT EXISTS vehicles_search (
      vehicle_id INTEGER PRIMARY KEY,
      public_url TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      badge TEXT NOT NULL,
      badge_detail TEXT NOT NULL,
      manufacturer_de TEXT NOT NULL,
      model_de TEXT NOT NULL,
      badge_de TEXT NOT NULL,
      fuel TEXT NOT NULL,
      fuel_de TEXT NOT NULL,
      year_month INTEGER,
      model_year TEXT NOT NULL,
      mileage_km INTEGER,
      price_manwon INTEGER,
      price_krw INTEGER,
      price_eur REAL,
      sell_type TEXT NOT NULL,
      sell_type_de TEXT NOT NULL,
      city TEXT NOT NULL,
      office_name TEXT NOT NULL,
      dealer_name TEXT NOT NULL,
      home_service_verification TEXT NOT NULL,
      trust_json TEXT NOT NULL,
      trust_de_json TEXT NOT NULL,
      service_mark_json TEXT NOT NULL,
      service_mark_de_json TEXT NOT NULL,
      conditions_json TEXT NOT NULL,
      conditions_de_json TEXT NOT NULL,
      buy_type_json TEXT NOT NULL,
      buy_type_de_json TEXT NOT NULL,
      thumb_url TEXT NOT NULL,
      image_count INTEGER NOT NULL,
      summary_de TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicle_details (
      vehicle_id INTEGER PRIMARY KEY REFERENCES vehicles_search(vehicle_id) ON DELETE CASCADE,
      vin TEXT NOT NULL,
      vehicle_no TEXT NOT NULL,
      body_name TEXT NOT NULL,
      body_name_de TEXT NOT NULL,
      displacement_cc INTEGER,
      transmission TEXT NOT NULL,
      transmission_de TEXT NOT NULL,
      color TEXT NOT NULL,
      color_de TEXT NOT NULL,
      seats INTEGER,
      contact_phone TEXT NOT NULL,
      contact_address TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      dealer_firm TEXT NOT NULL,
      original_price_manwon INTEGER,
      original_price_krw INTEGER,
      original_price_eur REAL,
      description_ko TEXT NOT NULL,
      description_de TEXT NOT NULL,
      option_codes_json TEXT NOT NULL,
      accident_record_available INTEGER NOT NULL,
      inspection_formats_json TEXT NOT NULL,
      seizing_count INTEGER,
      pledge_count INTEGER,
      raw_json TEXT NOT NULL,
      hydrated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicle_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL REFERENCES vehicles_search(vehicle_id) ON DELETE CASCADE,
      ordering INTEGER NOT NULL,
      source_url TEXT NOT NULL,
      type TEXT NOT NULL,
      caption TEXT NOT NULL,
      cache_path TEXT,
      UNIQUE(vehicle_id, source_url)
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_search_manufacturer ON vehicles_search(manufacturer);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_model ON vehicles_search(model);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_badge ON vehicles_search(badge);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_fuel ON vehicles_search(fuel);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_city ON vehicles_search(city);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_price_eur ON vehicles_search(price_eur);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_price_krw ON vehicles_search(price_krw);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_year_month ON vehicles_search(year_month);
    CREATE INDEX IF NOT EXISTS idx_vehicles_search_mileage ON vehicles_search(mileage_km);
    CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON vehicle_images(vehicle_id);
  `);

  return db;
}

export function getDb() {
  globalThis.__encarExplorerDb ??= createDatabase();
  return globalThis.__encarExplorerDb;
}

export function setSetting(key: string, value: string) {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `,
  ).run(key, value, nowIso());
}

export function getSetting(key: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM settings WHERE key = ?`)
    .get(key) as { value?: string } | undefined;
  return row?.value ?? null;
}

export function saveExchangeRates(base: string, date: string, rates: Record<string, number>) {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO exchange_rates (base, date, rates_json, fetched_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(base, date) DO UPDATE SET
        rates_json = excluded.rates_json,
        fetched_at = excluded.fetched_at
    `,
  ).run(base, date, jsonStringify(rates), nowIso());
}

export function getLatestExchangeRates(base = "KRW") {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT base, date, rates_json, fetched_at FROM exchange_rates WHERE base = ? ORDER BY date DESC, fetched_at DESC LIMIT 1`,
    )
    .get(base) as
    | { base: string; date: string; rates_json: string; fetched_at: string }
    | undefined;

  if (!row) return null;

  return {
    base: row.base,
    date: row.date,
    fetchedAt: row.fetched_at,
    rates: jsonParse<Record<string, number>>(row.rates_json, {}),
  };
}

export function saveFacetSnapshot(queryKey: string, payload: EncarINavResponse) {
  const db = getDb();
  db.prepare(
    `
      INSERT INTO facet_snapshots (query_key, payload_json, fetched_at)
      VALUES (?, ?, ?)
      ON CONFLICT(query_key) DO UPDATE SET
        payload_json = excluded.payload_json,
        fetched_at = excluded.fetched_at
    `,
  ).run(queryKey, jsonStringify(payload), nowIso());
}

export function getFacetSnapshot(queryKey = "all-catalog") {
  const db = getDb();
  const row = db
    .prepare(`SELECT payload_json, fetched_at FROM facet_snapshots WHERE query_key = ?`)
    .get(queryKey) as { payload_json: string; fetched_at: string } | undefined;

  if (!row) return null;

  return {
    fetchedAt: row.fetched_at,
    payload: jsonParse<EncarINavResponse>(row.payload_json, {
      Count: 0,
      iNav: { Items: [] },
    }),
  };
}

export function createSyncRun(type: string) {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO sync_runs (type, started_at, success, processed_count, message) VALUES (?, ?, 0, 0, '')`,
    )
    .run(type, nowIso());
  return Number(result.lastInsertRowid);
}

export function finishSyncRun(id: number, success: boolean, processedCount: number, message: string) {
  const db = getDb();
  db.prepare(
    `UPDATE sync_runs SET finished_at = ?, success = ?, processed_count = ?, message = ? WHERE id = ?`,
  ).run(nowIso(), success ? 1 : 0, processedCount, message, id);
}

export function upsertSearchVehicles(rows: NormalizedVehicle[], rawRows: EncarSearchResult[]) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO vehicles_search (
      vehicle_id, public_url, manufacturer, model, badge, badge_detail,
      manufacturer_de, model_de, badge_de, fuel, fuel_de, year_month, model_year,
      mileage_km, price_manwon, price_krw, price_eur, sell_type, sell_type_de,
      city, office_name, dealer_name, home_service_verification,
      trust_json, trust_de_json, service_mark_json, service_mark_de_json,
      conditions_json, conditions_de_json, buy_type_json, buy_type_de_json,
      thumb_url, image_count, summary_de, raw_json, synced_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
    ON CONFLICT(vehicle_id) DO UPDATE SET
      public_url = excluded.public_url,
      manufacturer = excluded.manufacturer,
      model = excluded.model,
      badge = excluded.badge,
      badge_detail = excluded.badge_detail,
      manufacturer_de = excluded.manufacturer_de,
      model_de = excluded.model_de,
      badge_de = excluded.badge_de,
      fuel = excluded.fuel,
      fuel_de = excluded.fuel_de,
      year_month = excluded.year_month,
      model_year = excluded.model_year,
      mileage_km = excluded.mileage_km,
      price_manwon = excluded.price_manwon,
      price_krw = excluded.price_krw,
      price_eur = excluded.price_eur,
      sell_type = excluded.sell_type,
      sell_type_de = excluded.sell_type_de,
      city = excluded.city,
      office_name = excluded.office_name,
      dealer_name = excluded.dealer_name,
      home_service_verification = excluded.home_service_verification,
      trust_json = excluded.trust_json,
      trust_de_json = excluded.trust_de_json,
      service_mark_json = excluded.service_mark_json,
      service_mark_de_json = excluded.service_mark_de_json,
      conditions_json = excluded.conditions_json,
      conditions_de_json = excluded.conditions_de_json,
      buy_type_json = excluded.buy_type_json,
      buy_type_de_json = excluded.buy_type_de_json,
      thumb_url = excluded.thumb_url,
      image_count = excluded.image_count,
      summary_de = excluded.summary_de,
      raw_json = excluded.raw_json,
      synced_at = excluded.synced_at
  `);

  const syncedAt = nowIso();
  runTransaction(db, () => {
    rows.forEach((row, index) => {
      const raw = rawRows[index];
      stmt.run(
        row.vehicleId,
        row.publicUrl,
        row.manufacturer,
        row.model,
        row.badge,
        row.badgeDetail,
        row.manufacturerDe,
        row.modelDe,
        row.badgeDe,
        row.fuel,
        row.fuelDe,
        row.yearMonth,
        row.modelYear,
        row.mileageKm,
        row.priceManwon,
        row.priceKrw,
        row.priceEur,
        row.sellType,
        row.sellTypeDe,
        row.city,
        row.officeName,
        row.dealerName,
        row.homeServiceVerification,
        jsonStringify(row.trust),
        jsonStringify(row.trustDe),
        jsonStringify(row.serviceMark),
        jsonStringify(row.serviceMarkDe),
        jsonStringify(row.conditions),
        jsonStringify(row.conditionsDe),
        jsonStringify(row.buyType),
        jsonStringify(row.buyTypeDe),
        row.thumbUrl,
        row.imageCount,
        row.summaryDe,
        jsonStringify(raw),
        syncedAt,
      );
    });
  });
}

export function upsertVehicleDetail(
  row: NormalizedVehicleDetail,
  raw: EncarVehicleDetail,
  images: Array<{ ordering: number; sourceUrl: string; type: string; caption: string }>,
) {
  const db = getDb();
  const insertDetail = db.prepare(`
    INSERT INTO vehicle_details (
      vehicle_id, vin, vehicle_no, body_name, body_name_de, displacement_cc,
      transmission, transmission_de, color, color_de, seats, contact_phone,
      contact_address, contact_person, dealer_firm, original_price_manwon,
      original_price_krw, original_price_eur, description_ko, description_de,
      option_codes_json, accident_record_available, inspection_formats_json,
      seizing_count, pledge_count, raw_json, hydrated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(vehicle_id) DO UPDATE SET
      vin = excluded.vin,
      vehicle_no = excluded.vehicle_no,
      body_name = excluded.body_name,
      body_name_de = excluded.body_name_de,
      displacement_cc = excluded.displacement_cc,
      transmission = excluded.transmission,
      transmission_de = excluded.transmission_de,
      color = excluded.color,
      color_de = excluded.color_de,
      seats = excluded.seats,
      contact_phone = excluded.contact_phone,
      contact_address = excluded.contact_address,
      contact_person = excluded.contact_person,
      dealer_firm = excluded.dealer_firm,
      original_price_manwon = excluded.original_price_manwon,
      original_price_krw = excluded.original_price_krw,
      original_price_eur = excluded.original_price_eur,
      description_ko = excluded.description_ko,
      description_de = excluded.description_de,
      option_codes_json = excluded.option_codes_json,
      accident_record_available = excluded.accident_record_available,
      inspection_formats_json = excluded.inspection_formats_json,
      seizing_count = excluded.seizing_count,
      pledge_count = excluded.pledge_count,
      raw_json = excluded.raw_json,
      hydrated_at = excluded.hydrated_at
  `);

  const deleteImages = db.prepare(`DELETE FROM vehicle_images WHERE vehicle_id = ?`);
  const insertImage = db.prepare(`
    INSERT OR IGNORE INTO vehicle_images (vehicle_id, ordering, source_url, type, caption, cache_path)
    VALUES (?, ?, ?, ?, ?, NULL)
  `);

  runTransaction(db, () => {
    insertDetail.run(
      row.vehicleId,
      row.vin,
      row.vehicleNo,
      row.bodyName,
      row.bodyNameDe,
      row.displacementCc,
      row.transmission,
      row.transmissionDe,
      row.color,
      row.colorDe,
      row.seats,
      row.contactPhone,
      row.contactAddress,
      row.contactPerson,
      row.dealerFirm,
      row.originalPriceManwon,
      row.originalPriceKrw,
      row.originalPriceEur,
      row.descriptionKo,
      row.descriptionDe,
      jsonStringify(row.optionCodes),
      row.accidentRecordAvailable ? 1 : 0,
      jsonStringify(row.inspectionFormats),
      row.seizingCount,
      row.pledgeCount,
      jsonStringify(raw),
      nowIso(),
    );

    deleteImages.run(row.vehicleId);
    for (const image of images) {
      insertImage.run(
        row.vehicleId,
        image.ordering,
        image.sourceUrl,
        image.type,
        image.caption,
      );
    }
  });
}

export interface VehicleFilters {
  q?: string;
  manufacturer?: string;
  model?: string;
  fuel?: string;
  city?: string;
  sellType?: string;
  minPriceEur?: number;
  maxPriceEur?: number;
  minMileage?: number;
  maxMileage?: number;
  minYear?: number;
  maxYear?: number;
  hasDetails?: boolean;
  hasCachedImages?: boolean;
  hasVin?: boolean;
  page?: number;
  pageSize?: number;
  sort?: string;
}

function buildVehicleWhere(filters: VehicleFilters) {
  const where: string[] = [];
  const params: Array<string | number> = [];

  if (filters.q) {
    const q = `%${filters.q.trim()}%`;
    where.push(`(
      v.manufacturer LIKE ? OR
      v.model LIKE ? OR
      v.badge LIKE ? OR
      v.city LIKE ? OR
      v.dealer_name LIKE ? OR
      d.description_de LIKE ? OR
      CAST(v.vehicle_id AS TEXT) = ?
    )`);
    params.push(q, q, q, q, q, q, filters.q.trim());
  }

  if (filters.manufacturer) {
    where.push(`v.manufacturer = ?`);
    params.push(filters.manufacturer);
  }

  if (filters.model) {
    where.push(`v.model = ?`);
    params.push(filters.model);
  }

  if (filters.fuel) {
    where.push(`v.fuel = ?`);
    params.push(filters.fuel);
  }

  if (filters.city) {
    where.push(`v.city = ?`);
    params.push(filters.city);
  }

  if (filters.sellType) {
    where.push(`v.sell_type = ?`);
    params.push(filters.sellType);
  }

  if (filters.minPriceEur != null) {
    where.push(`v.price_eur >= ?`);
    params.push(filters.minPriceEur);
  }

  if (filters.maxPriceEur != null) {
    where.push(`v.price_eur <= ?`);
    params.push(filters.maxPriceEur);
  }

  if (filters.minMileage != null) {
    where.push(`v.mileage_km >= ?`);
    params.push(filters.minMileage);
  }

  if (filters.maxMileage != null) {
    where.push(`v.mileage_km <= ?`);
    params.push(filters.maxMileage);
  }

  if (filters.minYear != null) {
    where.push(`v.year_month >= ?`);
    params.push(filters.minYear * 100);
  }

  if (filters.maxYear != null) {
    where.push(`v.year_month <= ?`);
    params.push(filters.maxYear * 100 + 99);
  }

  if (filters.hasDetails) {
    where.push(`d.vehicle_id IS NOT NULL`);
  }

  if (filters.hasVin) {
    where.push(`d.vin != ''`);
  }

  if (filters.hasCachedImages) {
    where.push(`EXISTS (SELECT 1 FROM vehicle_images i WHERE i.vehicle_id = v.vehicle_id AND i.cache_path IS NOT NULL)`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

function resolveSort(sort: string | undefined) {
  switch (sort) {
    case "priceAsc":
      return `(v.price_eur IS NULL) ASC, v.price_eur ASC, v.price_krw ASC`;
    case "priceDesc":
      return `(v.price_eur IS NULL) ASC, v.price_eur DESC, v.price_krw DESC`;
    case "mileageAsc":
      return `(v.mileage_km IS NULL) ASC, v.mileage_km ASC`;
    case "mileageDesc":
      return `(v.mileage_km IS NULL) ASC, v.mileage_km DESC`;
    case "yearAsc":
      return `(v.year_month IS NULL) ASC, v.year_month ASC`;
    case "yearDesc":
      return `(v.year_month IS NULL) ASC, v.year_month DESC`;
    case "eurPerKmAsc":
      return `((v.price_eur / NULLIF(v.mileage_km, 0)) IS NULL) ASC, (v.price_eur / NULLIF(v.mileage_km, 0)) ASC`;
    default:
      return `v.synced_at DESC, (v.year_month IS NULL) ASC, v.year_month DESC, v.vehicle_id DESC`;
  }
}

export function queryVehicles(filters: VehicleFilters) {
  const db = getDb();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 40, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const offset = (page - 1) * pageSize;
  const fromSql = `FROM vehicles_search v LEFT JOIN vehicle_details d ON d.vehicle_id = v.vehicle_id`;
  const { whereSql, params } = buildVehicleWhere(filters);
  const sortSql = resolveSort(filters.sort);

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS count ${fromSql} ${whereSql}`)
    .get(...params) as { count: number };

  const rows = db
    .prepare(
      `
      SELECT
        v.*,
        d.vin AS detail_vin,
        d.description_de AS detail_description_de,
        d.vehicle_id AS detail_vehicle_id,
        EXISTS (SELECT 1 FROM vehicle_images i WHERE i.vehicle_id = v.vehicle_id) AS has_any_images,
        EXISTS (SELECT 1 FROM vehicle_images i WHERE i.vehicle_id = v.vehicle_id AND i.cache_path IS NOT NULL) AS has_cached_images
      ${fromSql}
      ${whereSql}
      ORDER BY ${sortSql}
      LIMIT ? OFFSET ?
      `,
    )
    .all(...params, pageSize, offset) as Array<Record<string, unknown>>;

  return {
    total: Number(totalRow.count ?? 0),
    page,
    pageSize,
    items: rows.map((row) => ({
      vehicleId: Number(row.vehicle_id),
      publicUrl: String(row.public_url),
      manufacturer: String(row.manufacturer),
      model: String(row.model),
      badge: String(row.badge),
      badgeDetail: String(row.badge_detail),
      manufacturerDe: String(row.manufacturer_de),
      modelDe: String(row.model_de),
      badgeDe: String(row.badge_de),
      fuel: String(row.fuel),
      fuelDe: String(row.fuel_de),
      yearMonth: row.year_month == null ? null : Number(row.year_month),
      modelYear: String(row.model_year),
      mileageKm: row.mileage_km == null ? null : Number(row.mileage_km),
      priceManwon: row.price_manwon == null ? null : Number(row.price_manwon),
      priceKrw: row.price_krw == null ? null : Number(row.price_krw),
      priceEur: row.price_eur == null ? null : Number(row.price_eur),
      sellType: String(row.sell_type),
      sellTypeDe: String(row.sell_type_de),
      city: String(row.city),
      officeName: String(row.office_name),
      dealerName: String(row.dealer_name),
      homeServiceVerification: String(row.home_service_verification),
      trust: jsonParse<string[]>(String(row.trust_json ?? "[]"), []),
      trustDe: jsonParse<string[]>(String(row.trust_de_json ?? "[]"), []),
      serviceMark: jsonParse<string[]>(String(row.service_mark_json ?? "[]"), []),
      serviceMarkDe: jsonParse<string[]>(String(row.service_mark_de_json ?? "[]"), []),
      conditions: jsonParse<string[]>(String(row.conditions_json ?? "[]"), []),
      conditionsDe: jsonParse<string[]>(String(row.conditions_de_json ?? "[]"), []),
      buyType: jsonParse<string[]>(String(row.buy_type_json ?? "[]"), []),
      buyTypeDe: jsonParse<string[]>(String(row.buy_type_de_json ?? "[]"), []),
      thumbUrl: String(row.thumb_url),
      imageCount: Number(row.image_count),
      summaryDe: String(row.summary_de),
      hasDetails: Boolean(row.detail_vehicle_id),
      hasCachedImages: Boolean(row.has_cached_images),
      hasAnyImages: Boolean(row.has_any_images),
      vin: row.detail_vin ? String(row.detail_vin) : "",
    })),
  };
}

export function getVehicleById(vehicleId: number) {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT
        v.*,
        d.vin AS d_vin,
        d.vehicle_no AS d_vehicle_no,
        d.body_name AS d_body_name,
        d.body_name_de AS d_body_name_de,
        d.displacement_cc AS d_displacement_cc,
        d.transmission AS d_transmission,
        d.transmission_de AS d_transmission_de,
        d.color AS d_color,
        d.color_de AS d_color_de,
        d.seats AS d_seats,
        d.contact_phone AS d_contact_phone,
        d.contact_address AS d_contact_address,
        d.contact_person AS d_contact_person,
        d.dealer_firm AS d_dealer_firm,
        d.original_price_manwon AS d_original_price_manwon,
        d.original_price_krw AS d_original_price_krw,
        d.original_price_eur AS d_original_price_eur,
        d.description_ko AS d_description_ko,
        d.description_de AS d_description_de,
        d.option_codes_json AS d_option_codes_json,
        d.accident_record_available AS d_accident_record_available,
        d.inspection_formats_json AS d_inspection_formats_json,
        d.seizing_count AS d_seizing_count,
        d.pledge_count AS d_pledge_count,
        d.raw_json AS d_raw_json,
        d.hydrated_at AS d_hydrated_at
      FROM vehicles_search v
      LEFT JOIN vehicle_details d ON d.vehicle_id = v.vehicle_id
      WHERE v.vehicle_id = ?
      `,
    )
    .get(vehicleId) as Record<string, unknown> | undefined;

  if (!row) return null;

  const images = db
    .prepare(
      `SELECT ordering, source_url, type, caption, cache_path FROM vehicle_images WHERE vehicle_id = ? ORDER BY ordering ASC, id ASC`,
    )
    .all(vehicleId) as Array<Record<string, unknown>>;

  return {
    vehicleId: Number(row.vehicle_id),
    publicUrl: String(row.public_url),
    manufacturer: String(row.manufacturer),
    model: String(row.model),
    badge: String(row.badge),
    badgeDetail: String(row.badge_detail),
    manufacturerDe: String(row.manufacturer_de),
    modelDe: String(row.model_de),
    badgeDe: String(row.badge_de),
    fuel: String(row.fuel),
    fuelDe: String(row.fuel_de),
    yearMonth: row.year_month == null ? null : Number(row.year_month),
    modelYear: String(row.model_year),
    mileageKm: row.mileage_km == null ? null : Number(row.mileage_km),
    priceManwon: row.price_manwon == null ? null : Number(row.price_manwon),
    priceKrw: row.price_krw == null ? null : Number(row.price_krw),
    priceEur: row.price_eur == null ? null : Number(row.price_eur),
    sellType: String(row.sell_type),
    sellTypeDe: String(row.sell_type_de),
    city: String(row.city),
    officeName: String(row.office_name),
    dealerName: String(row.dealer_name),
    trustDe: jsonParse<string[]>(String(row.trust_de_json ?? "[]"), []),
    serviceMarkDe: jsonParse<string[]>(String(row.service_mark_de_json ?? "[]"), []),
    conditionsDe: jsonParse<string[]>(String(row.conditions_de_json ?? "[]"), []),
    buyTypeDe: jsonParse<string[]>(String(row.buy_type_de_json ?? "[]"), []),
    thumbUrl: String(row.thumb_url),
    summaryDe: String(row.summary_de),
    vin: String(row.d_vin ?? ""),
    vehicleNo: String(row.d_vehicle_no ?? ""),
    bodyName: String(row.d_body_name ?? ""),
    bodyNameDe: String(row.d_body_name_de ?? ""),
    displacementCc: row.d_displacement_cc == null ? null : Number(row.d_displacement_cc),
    transmission: String(row.d_transmission ?? ""),
    transmissionDe: String(row.d_transmission_de ?? ""),
    color: String(row.d_color ?? ""),
    colorDe: String(row.d_color_de ?? ""),
    seats: row.d_seats == null ? null : Number(row.d_seats),
    contactPhone: String(row.d_contact_phone ?? ""),
    contactAddress: String(row.d_contact_address ?? ""),
    contactPerson: String(row.d_contact_person ?? ""),
    dealerFirm: String(row.d_dealer_firm ?? ""),
    originalPriceManwon:
      row.d_original_price_manwon == null ? null : Number(row.d_original_price_manwon),
    originalPriceKrw: row.d_original_price_krw == null ? null : Number(row.d_original_price_krw),
    originalPriceEur: row.d_original_price_eur == null ? null : Number(row.d_original_price_eur),
    descriptionKo: String(row.d_description_ko ?? ""),
    descriptionDe: String(row.d_description_de ?? ""),
    optionCodes: jsonParse<string[]>(String(row.d_option_codes_json ?? "[]"), []),
    inspectionFormats: jsonParse<string[]>(String(row.d_inspection_formats_json ?? "[]"), []),
    accidentRecordAvailable: Boolean(row.d_accident_record_available),
    seizingCount: row.d_seizing_count == null ? null : Number(row.d_seizing_count),
    pledgeCount: row.d_pledge_count == null ? null : Number(row.d_pledge_count),
    rawSearch: jsonParse<EncarSearchResult>(String(row.raw_json ?? "{}"), {} as EncarSearchResult),
    rawDetail: jsonParse<EncarVehicleDetail>(String(row.d_raw_json ?? "{}"), {} as EncarVehicleDetail),
    hydratedAt: String(row.d_hydrated_at ?? ""),
    images: images.map((image) => ({
      ordering: Number(image.ordering),
      sourceUrl: String(image.source_url),
      type: String(image.type),
      caption: String(image.caption),
      cachePath: image.cache_path ? String(image.cache_path) : null,
    })),
  };
}

export function getDashboardStats() {
  const db = getDb();
  const totals = db
    .prepare(
      `
      SELECT
        (SELECT COUNT(*) FROM vehicles_search) AS vehicles,
        (SELECT COUNT(*) FROM vehicle_details) AS details,
        (SELECT COUNT(*) FROM vehicle_images) AS images,
        (SELECT COUNT(*) FROM vehicle_images WHERE cache_path IS NOT NULL) AS cached_images,
        (SELECT MAX(synced_at) FROM vehicles_search) AS last_catalog_sync,
        (SELECT MAX(hydrated_at) FROM vehicle_details) AS last_detail_sync
      `,
    )
    .get() as Record<string, unknown>;

  const latestRates = getLatestExchangeRates();
  const totalAvailable = Number(getSetting("catalog_total_available") ?? 0);

  return {
    vehicles: Number(totals.vehicles ?? 0),
    details: Number(totals.details ?? 0),
    images: Number(totals.images ?? 0),
    cachedImages: Number(totals.cached_images ?? 0),
    totalAvailable,
    lastCatalogSync: totals.last_catalog_sync ? String(totals.last_catalog_sync) : null,
    lastDetailSync: totals.last_detail_sync ? String(totals.last_detail_sync) : null,
    latestRates,
  };
}

export function getFilterOptions() {
  const db = getDb();

  const facet = (sql: string, limit = 30) =>
    (db.prepare(`${sql} LIMIT ${limit}`).all() as Array<Record<string, unknown>>).map(
      (row) => ({
        value: String(row.value),
        count: Number(row.count),
      }),
    );

  const withLabel = (
    items: Array<{ value: string; count: number }>,
    translator: (value: string) => string,
  ) => items.map((item) => ({ ...item, label: translator(item.value) }));

  return {
    manufacturers: withLabel(
      facet(
        `SELECT manufacturer AS value, COUNT(*) AS count FROM vehicles_search GROUP BY manufacturer ORDER BY count DESC`,
        80,
      ),
      translateManufacturerName,
    ),
    models: withLabel(
      facet(
        `SELECT model AS value, COUNT(*) AS count FROM vehicles_search GROUP BY model ORDER BY count DESC`,
        80,
      ),
      (value) => translateModelName(value),
    ),
    fuels: withLabel(
      facet(
        `SELECT fuel AS value, COUNT(*) AS count FROM vehicles_search GROUP BY fuel ORDER BY count DESC`,
        20,
      ),
      translateLiteral,
    ),
    cities: withLabel(
      facet(
        `SELECT city AS value, COUNT(*) AS count FROM vehicles_search GROUP BY city ORDER BY count DESC`,
        80,
      ),
      translateRegionName,
    ),
    sellTypes: withLabel(
      facet(
        `SELECT sell_type AS value, COUNT(*) AS count FROM vehicles_search GROUP BY sell_type ORDER BY count DESC`,
        10,
      ),
      translateLiteral,
    ),
  };
}

export function getRecentSyncRuns(limit = 10) {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, type, started_at, finished_at, success, processed_count, message FROM sync_runs ORDER BY id DESC LIMIT ?`,
    )
    .all(limit) as Array<Record<string, unknown>>;
}

export function listVehicleIdsMissingDetails(limit = 100, force = false) {
  const db = getDb();
  const sql = force
    ? `SELECT vehicle_id FROM vehicles_search ORDER BY synced_at DESC LIMIT ?`
    : `
      SELECT v.vehicle_id
      FROM vehicles_search v
      LEFT JOIN vehicle_details d ON d.vehicle_id = v.vehicle_id
      WHERE d.vehicle_id IS NULL
      ORDER BY v.synced_at DESC
      LIMIT ?
    `;

  return (db.prepare(sql).all(limit) as Array<{ vehicle_id: number }>).map((row) =>
    Number(row.vehicle_id),
  );
}

export function listImagesForCaching(limit = 200, vehicleId?: number) {
  const db = getDb();
  const sql = vehicleId
    ? `
      SELECT id, vehicle_id, ordering, source_url, type, caption, cache_path
      FROM vehicle_images
      WHERE vehicle_id = ? AND cache_path IS NULL
      ORDER BY vehicle_id ASC, ordering ASC
      LIMIT ?
    `
    : `
      SELECT id, vehicle_id, ordering, source_url, type, caption, cache_path
      FROM vehicle_images
      WHERE cache_path IS NULL
      ORDER BY vehicle_id ASC, ordering ASC
      LIMIT ?
    `;

  const rows = vehicleId
    ? (db.prepare(sql).all(vehicleId, limit) as Array<Record<string, unknown>>)
    : (db.prepare(sql).all(limit) as Array<Record<string, unknown>>);

  return rows.map((row) => ({
    id: Number(row.id),
    vehicleId: Number(row.vehicle_id),
    ordering: Number(row.ordering),
    sourceUrl: String(row.source_url),
    type: String(row.type),
    caption: String(row.caption),
    cachePath: row.cache_path ? String(row.cache_path) : null,
  }));
}

export function markImageCached(id: number, cachePath: string) {
  const db = getDb();
  db.prepare(`UPDATE vehicle_images SET cache_path = ? WHERE id = ?`).run(cachePath, id);
}
