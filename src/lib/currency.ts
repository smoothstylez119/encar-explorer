interface ExchangeRateSnapshot {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export async function fetchExchangeRates(base = "KRW") {
  const response = await fetch(
    `https://api.frankfurter.app/latest?from=${base}&to=EUR,USD`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Exchange rate fetch failed: ${response.status}`);
  }

  return (await response.json()) as ExchangeRateSnapshot;
}

export function krwManwonToKrw(value: number | null | undefined) {
  if (value == null) return null;
  return Math.round(value * 10_000);
}

export function krwToEuro(krw: number | null | undefined, eurRate: number | null) {
  if (krw == null || eurRate == null) return null;
  return krw * eurRate;
}

export function formatCurrency(value: number | null | undefined, currency: "KRW" | "EUR") {
  if (value == null) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 0,
  }).format(value);
}
