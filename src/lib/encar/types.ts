export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface EncarSearchPhoto {
  type: string;
  location: string;
  updatedDate: string;
  ordering: number;
}

export interface EncarSearchResult {
  Id: string;
  Separation?: string[];
  Trust?: string[];
  ServiceMark?: string[];
  Condition?: string[];
  Photo?: string;
  Photos?: EncarSearchPhoto[];
  Manufacturer?: string;
  Model?: string;
  Badge?: string;
  BadgeDetail?: string;
  GreenType?: string;
  EvType?: string;
  FuelType?: string;
  Year?: number;
  FormYear?: string;
  Mileage?: number;
  HomeServiceVerification?: string;
  ServiceCopyCar?: string;
  Price?: number;
  SellType?: string;
  BuyType?: string[];
  OfficeCityState?: string;
  OfficeName?: string;
  DealerName?: string;
}

export interface EncarSearchResponse {
  Count: number;
  SearchResults: EncarSearchResult[];
}

export interface EncarFacet {
  IsSelected?: boolean;
  Value?: string;
  DisplayValue?: string;
  Action?: string;
  Count?: number;
  Expression?: string;
  Metadata?: Record<string, JsonValue>;
}

export interface EncarINavItem {
  Name?: string;
  DisplayName?: string;
  Type?: string;
  Facets?: EncarFacet[];
  Metadata?: Record<string, JsonValue>;
  PlaceholderExpression?: string;
  QueryWithPlaceholder?: string;
  LowerPlaceholder?: string;
  UpperPlaceholder?: string;
  Placeholder?: string;
  RemoveAction?: string;
  MultiSelectMode?: string;
}

export interface EncarINavResponse {
  Count: number;
  iNav: {
    Items: EncarINavItem[];
    Sorts?: Array<Record<string, JsonValue>>;
    BreadCrumbs?: Array<Record<string, JsonValue>>;
  };
}

export interface EncarVehiclePhoto {
  code: string;
  path: string;
  type: string;
  updateDateTime: string;
  desc: string | null;
}

export interface EncarVehicleDetail {
  manage?: Record<string, JsonValue>;
  category?: Record<string, JsonValue>;
  advertisement?: Record<string, JsonValue>;
  contact?: Record<string, JsonValue>;
  spec?: Record<string, JsonValue>;
  photos?: EncarVehiclePhoto[];
  options?: Record<string, JsonValue>;
  condition?: Record<string, JsonValue>;
  partnership?: Record<string, JsonValue>;
  contents?: Record<string, JsonValue>;
  view?: Record<string, JsonValue>;
  vehicleType?: string;
  vin?: string;
  vehicleId?: number;
  vehicleNo?: string;
}

export interface SearchCatalogPage {
  offset: number;
  limit: number;
  total: number;
  results: EncarSearchResult[];
}
