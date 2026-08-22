import { addDays, isSaturday, isSunday } from "date-fns";

/**
 * Adds n business days (Mon-Fri) to a date. No public-holiday calendar in
 * v1 — the brief supplies no holiday data source (see DECISIONS.md).
 */
export function addBusinessDays(start: Date, n: number): Date {
  let date = start;
  let remaining = n;

  while (remaining > 0) {
    date = addDays(date, 1);
    if (!isSaturday(date) && !isSunday(date)) {
      remaining -= 1;
    }
  }

  return date;
}
