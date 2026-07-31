import type { RampsOrder } from '@metamask/ramps-controller';

export type PendingOrderPreview = Pick<RampsOrder, 'cryptoCurrency'>;

// Session-scoped preview map; real order data supersedes these entries.
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
