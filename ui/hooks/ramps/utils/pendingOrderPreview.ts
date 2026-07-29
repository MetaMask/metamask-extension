import type { RampsOrder } from '@metamask/ramps-controller';

export type PendingOrderPreview = Pick<
  RampsOrder,
  | 'cryptoAmount'
  | 'cryptoCurrency'
  | 'fiatAmount'
  | 'fiatCurrency'
  | 'totalFeesFiat'
>;

// ponytail: unbounded in-memory map, keyed by order code — bounded in
// practice by how many buys a user starts in one session; real order data
// (see withPendingOrderPreview in mapRampsOrderSafely.ts) supersedes these as
// soon as it arrives, so stale entries just go unused rather than misrender.
const previews = new Map<string, PendingOrderPreview>();

export function setPendingOrderPreview(
  orderCode: string,
  preview: PendingOrderPreview,
): void {
  previews.set(orderCode, preview);
}

export function getPendingOrderPreview(
  orderCode: string,
): PendingOrderPreview | undefined {
  return previews.get(orderCode);
}

export function removePendingOrderPreview(orderCode: string): void {
  previews.delete(orderCode);
}
