export const fuelMap: Record<string, string> = {
  "가솔린": "Benzin",
  "가솔린+전기": "Plug-in-Hybrid / Benzin+Elektro",
  "LPG(일반인 구입)": "LPG",
  "디젤": "Diesel",
  "전기": "Elektro",
  "LPG": "LPG",
  "LPG+전기": "LPG-Hybrid",
  "하이브리드": "Hybrid",
  "수소": "Wasserstoff",
  "CNG": "CNG",
};

export const transmissionMap: Record<string, string> = {
  "오토": "Automatik",
  "수동": "Schaltgetriebe",
  "세미오토": "Halbautomatik",
  "CVT": "CVT",
};

export const colorMap: Record<string, string> = {
  "흰색": "Weiss",
  "검정색": "Schwarz",
  "은색": "Silber",
  "회색": "Grau",
  "쥐색": "Grau",
  "파란색": "Blau",
  "빨간색": "Rot",
  "초록색": "Gruen",
  "갈색": "Braun",
  "베이지색": "Beige",
  "노란색": "Gelb",
  "주황색": "Orange",
  "보라색": "Lila",
  "기타": "Sonstige",
};

export const sellTypeMap: Record<string, string> = {
  "일반": "Direktverkauf",
  "리스": "Leasinguebernahme",
  "렌트": "Mietwagen / Rent",
};

export const trustMap: Record<string, string> = {
  ExtendWarranty: "Erweiterte Garantie",
  Warranty: "Garantie",
  HomeService: "Lieferung / Heimservice",
  Meetgo: "Meetgo / Vor-Ort-Service",
};

export const serviceMarkMap: Record<string, string> = {
  EncarMeetgo: "Encar Meetgo",
  EncarDiagnosisP0: "Encar Diagnose",
  EncarDiagnosisP1: "Encar Diagnose+",
  EncarDiagnosisP2: "Encar Diagnose++",
};

export const conditionMap: Record<string, string> = {
  Inspection: "Inspektion",
  InspectionDirect: "Direkt geprueft",
  Record: "Wartungs-/Zustandsakte",
  Resume: "Beschreibung vorhanden",
};

export const buyTypeMap: Record<string, string> = {
  Delivery: "Lieferung",
  Visit: "Besichtigung / Abholung",
};

export const bodyNameMap: Record<string, string> = {
  "경차": "Kleinstwagen",
  "소형차": "Kleinwagen",
  "준중형차": "Kompaktklasse",
  "중형차": "Mittelklasse",
  "대형차": "Oberklasse",
  "스포츠카": "Sportwagen",
  "RV/SUV": "SUV / Crossover",
  "승합차": "Van / Bus",
  "화물차": "Nutzfahrzeug",
};

export const manufacturerMap: Record<string, string> = {
  "기아": "Kia",
  "현대": "Hyundai",
  "제네시스": "Genesis",
  "르노코리아(삼성)": "Renault Korea (Samsung)",
  "쉐보레(GM대우)": "Chevrolet (GM Daewoo)",
  "쉐보레": "Chevrolet",
  "벤츠": "Mercedes-Benz",
  "포르쉐": "Porsche",
  "BMW": "BMW",
};

export const regionMap: Record<string, string> = {
  "서울": "Seoul",
  "경기": "Gyeonggi",
  "인천": "Incheon",
  "부산": "Busan",
  "대구": "Daegu",
  "대전": "Daejeon",
  "광주": "Gwangju",
  "울산": "Ulsan",
  "세종": "Sejong",
  "강원": "Gangwon",
  "충북": "North Chungcheong",
  "충남": "South Chungcheong",
  "전북": "North Jeolla",
  "전남": "South Jeolla",
  "경북": "North Gyeongsang",
  "경남": "South Gyeongsang",
  "제주": "Jeju",
};

const commonTokenPairs: Array<[string, string]> = [
  ["플러그인 하이브리드", "Plug-in Hybrid"],
  ["하이브리드", "Hybrid"],
  ["가솔린", "Benzin"],
  ["디젤", "Diesel"],
  ["전기", "Elektro"],
  ["더 뉴", "The New"],
  ["올 뉴", "All-New"],
  ["시그니처", "Signature"],
  ["캘리그래피", "Calligraphy"],
  ["프레스티지", "Prestige"],
  ["노블레스", "Noblesse"],
  ["럭셔리", "Luxury"],
  ["프리미엄", "Premium"],
  ["그래비티", "Gravity"],
  ["투어링", "Touring"],
  ["쿠페", "Coupe"],
  ["카브리올레", "Cabriolet"],
  ["세단", "Sedan"],
  ["스포츠", "Sport"],
  ["M 스포츠", "M Sport"],
  ["프로", "Pro"],
  ["퍼포먼스", "Performance"],
  ["에디션", "Edition"],
  ["세대", "Gen"],
];

const modelWordPairs: Array<[string, string]> = [
  ["그랜저", "Grandeur"],
  ["쏘렌토", "Sorento"],
  ["카니발", "Carnival"],
  ["스포티지", "Sportage"],
  ["레이", "Ray"],
  ["카이엔", "Cayenne"],
  ["트레일블레이저", "Trailblazer"],
  ["S-클래스", "S-Class"],
  ["3시리즈", "3 Series"],
  ["4시리즈", "4 Series"],
  ["5시리즈", "5 Series"],
  ["7시리즈", "7 Series"],
  ["8시리즈", "8 Series"],
  ["2시리즈", "2 Series"],
];

const literalMaps = [
  fuelMap,
  transmissionMap,
  colorMap,
  sellTypeMap,
  bodyNameMap,
];

export function translateLiteral(value: string | null | undefined) {
  if (!value) return "";

  if (manufacturerMap[value]) return manufacturerMap[value];
  if (regionMap[value]) return regionMap[value];

  for (const map of literalMaps) {
    if (map[value]) return map[value];
  }

  return value;
}

export function translateList(values: string[] | undefined, map: Record<string, string>) {
  return (values ?? []).map((value) => map[value] ?? value);
}

function applyPairs(input: string, pairs: Array<[string, string]>) {
  let output = input;
  for (const [search, replacement] of pairs) {
    output = output.replaceAll(search, replacement);
  }
  return output.replace(/\s+/g, " ").trim();
}

function stripManufacturerFromModel(model: string, manufacturer?: string) {
  if (!manufacturer) return model;

  let output = model;
  output = output.replaceAll(manufacturer, " ");

  const translatedManufacturer = manufacturerMap[manufacturer];
  if (translatedManufacturer) {
    output = output.replaceAll(translatedManufacturer, " ");
  }

  return output.replace(/\s+/g, " ").trim();
}

export function translateManufacturerName(value: string | null | undefined) {
  return translateLiteral(value);
}

export function translateRegionName(value: string | null | undefined) {
  return translateLiteral(value);
}

export function translateModelName(value: string | null | undefined, manufacturer?: string) {
  if (!value) return "";

  const stripped = stripManufacturerFromModel(value, manufacturer);
  const withWords = applyPairs(stripped, modelWordPairs);
  return applyPairs(withWords, commonTokenPairs);
}

export function translateBadgeName(value: string | null | undefined) {
  if (!value) return "";
  return applyPairs(value, commonTokenPairs);
}
