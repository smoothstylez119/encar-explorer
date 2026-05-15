export function formatInteger(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatEuro(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKrw(value: number | null | undefined) {
  if (value == null) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatYearMonth(value: number | null | undefined) {
  if (!value) return "-";
  const year = Math.floor(value / 100);
  const month = String(value % 100).padStart(2, "0");
  return `${month}/${year}`;
}

export function compactDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
