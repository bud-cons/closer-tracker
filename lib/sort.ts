// Requested Time is free text (e.g. "1200", "1:00 PM", "1300"), not a real
// time column, so we parse it best-effort into minutes-since-midnight for
// sorting. Unparseable/empty values sort last within their date.
export function parseTimeToMinutes(value: string | null | undefined): number {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return Number.MAX_SAFE_INTEGER;

  let hours: number;
  let minutes: number;
  if (digits.length <= 2) {
    hours = Number(digits);
    minutes = 0;
  } else {
    minutes = Number(digits.slice(-2));
    hours = Number(digits.slice(0, -2));
  }

  if (/pm/i.test(value) && hours < 12) hours += 12;
  if (/am/i.test(value) && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

export function byDateThenTime<T extends { appointmentDate: Date | string; requestedTime: string | null }>(
  a: T,
  b: T
): number {
  const dateDiff = new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
  if (dateDiff !== 0) return dateDiff;
  return parseTimeToMinutes(a.requestedTime) - parseTimeToMinutes(b.requestedTime);
}
