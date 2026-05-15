import { krwManwonToKrw, krwToEuro } from "@/lib/currency";
import { getImageUrl, getPublicVehicleUrl } from "@/lib/encar/client";
import type { EncarSearchResult, EncarVehicleDetail } from "@/lib/encar/types";
import {
  bodyNameMap,
  buyTypeMap,
  colorMap,
  conditionMap,
  fuelMap,
  sellTypeMap,
  serviceMarkMap,
  transmissionMap,
  translateBadgeName,
  translateList,
  translateManufacturerName,
  translateModelName,
  translateRegionName,
} from "@/lib/translate/dictionaries";
import { translateTextFallback } from "@/lib/translate/text";

export interface NormalizedVehicle {
  vehicleId: number;
  publicUrl: string;
  manufacturer: string;
  model: string;
  badge: string;
  badgeDetail: string;
  manufacturerDe: string;
  modelDe: string;
  badgeDe: string;
  fuel: string;
  fuelDe: string;
  yearMonth: number | null;
  modelYear: string;
  mileageKm: number | null;
  priceManwon: number | null;
  priceKrw: number | null;
  priceEur: number | null;
  sellType: string;
  sellTypeDe: string;
  city: string;
  officeName: string;
  dealerName: string;
  homeServiceVerification: string;
  trust: string[];
  trustDe: string[];
  serviceMark: string[];
  serviceMarkDe: string[];
  conditions: string[];
  conditionsDe: string[];
  buyType: string[];
  buyTypeDe: string[];
  thumbUrl: string;
  imageCount: number;
  summaryDe: string;
}

export interface NormalizedVehicleDetail {
  vehicleId: number;
  vin: string;
  vehicleNo: string;
  bodyName: string;
  bodyNameDe: string;
  displacementCc: number | null;
  transmission: string;
  transmissionDe: string;
  color: string;
  colorDe: string;
  seats: number | null;
  contactPhone: string;
  contactAddress: string;
  contactPerson: string;
  dealerFirm: string;
  originalPriceManwon: number | null;
  originalPriceKrw: number | null;
  originalPriceEur: number | null;
  descriptionKo: string;
  descriptionDe: string;
  photoUrls: string[];
  photoCaptions: string[];
  optionCodes: string[];
  accidentRecordAvailable: boolean;
  inspectionFormats: string[];
  seizingCount: number | null;
  pledgeCount: number | null;
}

function deValue(value: string, map: Record<string, string>) {
  return map[value] ?? value;
}

export function normalizeSearchVehicle(
  input: EncarSearchResult,
  eurRate: number | null,
): NormalizedVehicle {
  const priceKrw = krwManwonToKrw(input.Price ?? null);

  return {
    vehicleId: Number(input.Id),
    publicUrl: getPublicVehicleUrl(input.Id),
    manufacturer: input.Manufacturer ?? "",
    model: input.Model ?? "",
    badge: input.Badge ?? "",
    badgeDetail: input.BadgeDetail ?? "",
    manufacturerDe: translateManufacturerName(input.Manufacturer ?? ""),
    modelDe: translateModelName(input.Model ?? "", input.Manufacturer ?? ""),
    badgeDe: translateBadgeName(input.Badge ?? ""),
    fuel: input.FuelType ?? "",
    fuelDe: deValue(input.FuelType ?? "", fuelMap),
    yearMonth: input.Year ?? null,
    modelYear: input.FormYear ?? "",
    mileageKm: input.Mileage ?? null,
    priceManwon: input.Price ?? null,
    priceKrw,
    priceEur: krwToEuro(priceKrw, eurRate),
    sellType: input.SellType ?? "",
    sellTypeDe: deValue(input.SellType ?? "", sellTypeMap),
    city: input.OfficeCityState ?? "",
    officeName: input.OfficeName ?? "",
    dealerName: input.DealerName ?? "",
    homeServiceVerification: input.HomeServiceVerification ?? "",
    trust: input.Trust ?? [],
    trustDe: translateList(input.Trust, {
      ExtendWarranty: "Erweiterte Garantie",
      Warranty: "Garantie",
      HomeService: "Lieferung / Heimservice",
      Meetgo: "Meetgo",
    }),
    serviceMark: input.ServiceMark ?? [],
    serviceMarkDe: translateList(input.ServiceMark, serviceMarkMap),
    conditions: input.Condition ?? [],
    conditionsDe: translateList(input.Condition, conditionMap),
    buyType: input.BuyType ?? [],
    buyTypeDe: translateList(input.BuyType, buyTypeMap),
    thumbUrl: getImageUrl(input.Photos?.[0]?.location ?? input.Photo ?? ""),
    imageCount: input.Photos?.length ?? 0,
    summaryDe: [
      deValue(input.FuelType ?? "", fuelMap),
      input.Mileage ? `${new Intl.NumberFormat("de-DE").format(input.Mileage)} km` : null,
      input.Price ? `${new Intl.NumberFormat("de-DE").format(input.Price)} 만원` : null,
      translateRegionName(input.OfficeCityState ?? "") || null,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function normalizeVehicleDetail(
  input: EncarVehicleDetail,
  eurRate: number | null,
  requestedVehicleId?: number,
): NormalizedVehicleDetail {
  const category = input.category ?? {};
  const spec = input.spec ?? {};
  const contact = input.contact ?? {};
  const partnership = input.partnership ?? {};
  const contents = input.contents ?? {};
  const condition = input.condition ?? {};
  const options = input.options ?? {};

  const originalPriceManwon = Number(category.originPrice ?? 0) || null;
  const originalPriceKrw = krwManwonToKrw(originalPriceManwon);
  const dealer =
    partnership.dealer && typeof partnership.dealer === "object"
      ? (partnership.dealer as Record<string, unknown>)
      : {};
  const firm =
    dealer.firm && typeof dealer.firm === "object"
      ? (dealer.firm as Record<string, unknown>)
      : {};
  const accident =
    condition.accident && typeof condition.accident === "object"
      ? (condition.accident as Record<string, unknown>)
      : {};
  const seizing =
    condition.seizing && typeof condition.seizing === "object"
      ? (condition.seizing as Record<string, unknown>)
      : {};
  const inspection =
    condition.inspection && typeof condition.inspection === "object"
      ? (condition.inspection as Record<string, unknown>)
      : {};

  return {
    vehicleId: requestedVehicleId ?? Number(input.vehicleId ?? 0),
    vin: String(input.vin ?? ""),
    vehicleNo: String(input.vehicleNo ?? ""),
    bodyName: String(spec.bodyName ?? ""),
    bodyNameDe: deValue(String(spec.bodyName ?? ""), bodyNameMap),
    displacementCc: Number(spec.displacement ?? 0) || null,
    transmission: String(spec.transmissionName ?? ""),
    transmissionDe: deValue(String(spec.transmissionName ?? ""), transmissionMap),
    color: String(spec.colorName ?? ""),
    colorDe: deValue(String(spec.colorName ?? ""), colorMap),
    seats: Number(spec.seatCount ?? 0) || null,
    contactPhone: String(contact.no ?? ""),
    contactAddress: String(contact.address ?? ""),
    contactPerson: String(dealer.name ?? ""),
    dealerFirm: String(firm.name ?? ""),
    originalPriceManwon,
    originalPriceKrw,
    originalPriceEur: krwToEuro(originalPriceKrw, eurRate),
    descriptionKo: String(contents.text ?? ""),
    descriptionDe: translateTextFallback(String(contents.text ?? "")),
    photoUrls: (input.photos ?? []).map((photo) => getImageUrl(photo.path)),
    photoCaptions: (input.photos ?? []).map((photo) => photo.desc ?? ""),
    optionCodes: [
      ...((options.standard as string[]) ?? []),
      ...((options.choice as string[]) ?? []),
      ...((options.etc as string[]) ?? []),
      ...((options.tuning as string[]) ?? []),
    ],
    accidentRecordAvailable: Boolean(accident.recordView),
    inspectionFormats: Array.isArray(inspection.formats)
      ? (inspection.formats as string[])
      : [],
    seizingCount: Number(seizing.seizingCount ?? 0),
    pledgeCount: Number(seizing.pledgeCount ?? 0),
  };
}
