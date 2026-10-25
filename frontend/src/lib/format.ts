const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 125000 → "$125,000.00". */
export function formatPrice(price: number) {
  return usd.format(price);
}
