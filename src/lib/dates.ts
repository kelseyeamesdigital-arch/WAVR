// Date helpers that respect the operator's timezone.
//
// Never use `new Date().toISOString().slice(0, 10)` for "today" — toISOString is
// always UTC, which for a NZ operator is still *yesterday* until ~midday local time.

/** Today's date as "YYYY-MM-DD" in the given IANA timezone (e.g. "Pacific/Auckland").
 *  Falls back to the device's local date if the timezone is missing or invalid. */
export function todayIn(timeZone?: string | null): string {
  const now = new Date();
  try {
    return formatYmd(now, timeZone || undefined);
  } catch {
    return formatYmd(now, undefined);
  }
}

/** Calendar-day arithmetic on a "YYYY-MM-DD" string. DST-safe, unlike adding 24h. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function formatYmd(date: Date, timeZone: string | undefined): string {
  // formatToParts rather than a locale's default format, which can change between browsers.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
