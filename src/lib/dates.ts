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

/** The UTC instants that bound a local calendar day in the given timezone — used to
 *  match rows by when they were signed (created_at is a timestamp, not a date). */
export function dayRangeUtc(ymd: string, timeZone?: string | null) {
  const start = zonedMidnightUtc(ymd, timeZone);
  const end = zonedMidnightUtc(addDays(ymd, 1), timeZone);
  return { start: start.toISOString(), end: end.toISOString() };
}

function zonedMidnightUtc(ymd: string, timeZone?: string | null): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const wanted = Date.UTC(y, m - 1, d);
  try {
    // Shift by the zone's offset, then correct again — on a daylight-saving
    // changeover the offset at midnight differs from the offset at the first
    // guess, so one pass alone lands an hour out.
    let result = new Date(wanted);
    for (let pass = 0; pass < 2; pass++) {
      result = new Date(result.getTime() + (wanted - wallClockAsUtc(result, timeZone)));
    }
    return result;
  } catch {
    return new Date(wanted);
  }
}

/** Reads the wall-clock time an instant shows in a zone, as if those were UTC fields. */
function wallClockAsUtc(date: Date, timeZone?: string | null): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone || undefined,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "0");
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"));
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
