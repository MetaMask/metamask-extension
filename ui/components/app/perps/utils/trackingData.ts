/**
 * Builds tracking data for perps analytics events that include VIP context.
 * @param options0
 * @param options0.totalFee
 * @param options0.marketPrice
 * @param options0.vipTier
 * @param options0.vipDiscount
 */
export function buildPerpsVipTrackingData({
  totalFee,
  marketPrice,
  vipTier,
  vipDiscount,
}: {
  totalFee: number;
  marketPrice: number;
  vipTier: number | null;
  vipDiscount: number | undefined;
}) {
  return {
    totalFee,
    marketPrice,
    ...(vipTier !== null && { vipTier }),
    ...(vipDiscount !== undefined && { vipDiscount }),
  };
}
