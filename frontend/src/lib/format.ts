const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 125000 → "$125,000.00". */
export function formatPrice(price: number) {
  return usd.format(price);
}

// en-GB gives "25 Oct 2026, 20:41"; the time is in the viewer's own timezone.
const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** ISO timestamp → "25 Oct 2026, 20:41" in local time. */
export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}
