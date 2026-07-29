/*
 * Maps a completed RampsOrder onto the `metamask-ramps` schema's
 * `ramps-transaction-completed` properties. This is the background counterpart
 * to the UI's `useRampsAnalytics`, so it owns the snake_case schema names.
 * Kept 1:1 with mobile's `buildV2AnalyticsPayload` (unified buy branch) in
 * metamask-mobile `ramps-controller/event-handlers/analytics.ts`.
 */
/* eslint-disable @typescript-eslint/naming-convention */
import type { RampsOrder } from '@metamask/ramps-controller';
import type { Json } from '@metamask/utils';

// Mirror of the UI hook's RAMPS_RAMP_TYPE / RAMPS_RAMP_ROUTING (see
// ui/hooks/ramps/useRampsAnalytics.ts) — duplicated rather than shared to
// avoid a UI→background import across the restricted-path boundary.
const RAMPS_RAMP_TYPE = 'UNIFIED_BUY_2';
const RAMPS_RAMP_ROUTING = 'AGGREGATOR';

export function buildRampsTransactionCompletedProperties(
  order: RampsOrder,
): Record<string, Json | undefined> {
  const cryptoAmount = Number(order.cryptoAmount);
  const totalFee = Number(order.totalFeesFiat);
  // Providers don't always populate exchangeRate; derive it from the amounts
  // net of fees, matching mobile.
  const computedExchangeRate =
    cryptoAmount > 0 ? (Number(order.fiatAmount) - totalFee) / cryptoAmount : 0;

  return {
    ramp_type: RAMPS_RAMP_TYPE,
    ramp_routing: RAMPS_RAMP_ROUTING,
    // Join key back to the provider order — never emit an empty string.
    ...(order.providerOrderId
      ? { provider_order_id: order.providerOrderId }
      : {}),
    amount_source: Number(order.fiatAmount),
    amount_destination: cryptoAmount,
    exchange_rate: Number(order.exchangeRate ?? computedExchangeRate),
    gas_fee: Number(order.networkFees ?? 0),
    processing_fee: Number(order.partnerFees ?? 0),
    total_fee: totalFee,
    payment_method_id: order.paymentMethod?.id ?? '',
    country: order.region ?? '',
    // Full CAIP-19 assetId (matching mobile) — the schema dropped the bare
    // chain_id since it is this value's CAIP-2 prefix.
    currency_destination: order.cryptoCurrency?.assetId ?? '',
    currency_destination_symbol: order.cryptoCurrency?.symbol,
    currency_destination_network: order.network?.name,
    currency_source: order.fiatCurrency?.symbol ?? '',
    provider_onramp: order.provider?.name ?? '',
  };
}

/**
 * `ramps-transaction-failed` shares the completed field set (mobile parity)
 * plus `error_message`.
 *
 * @param order - The failed RampsOrder.
 * @returns The `ramps-transaction-failed` event properties.
 */
export function buildRampsTransactionFailedProperties(
  order: RampsOrder,
): Record<string, Json | undefined> {
  return {
    ...buildRampsTransactionCompletedProperties(order),
    error_message: order.statusDescription || 'transaction_failed',
  };
}
