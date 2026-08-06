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
import {
  RAMPS_RAMP_ROUTING,
  RAMPS_RAMP_TYPE,
} from '../../../../shared/lib/ramps/analytics';

export function buildRampsTransactionCompletedProperties(
  order: RampsOrder,
  checkoutSessionId?: string,
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
    // Join key to the checkout funnel (opened → closed → completed). The
    // session id is the only stable key across the flow — the order id can
    // change when a provider swaps a precreated stub for its native id.
    ...(checkoutSessionId ? { checkout_session_id: checkoutSessionId } : {}),
    // Join key back to the provider order — the provider-scoped order code (not
    // the namespaced canonical id), read together with `provider_onramp`.
    // Never an empty string.
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
 * Maps a RampsOrder onto the `metamask-ramps` schema's
 * `ramps-transaction-confirmed` properties. Fires when a callback-fetched
 * order is first observed in a non-terminal state (the user has submitted the
 * order for processing but it has not completed yet). Kept in lockstep with
 * mobile's `buildRampsTransactionConfirmedParams` in metamask-mobile
 * `ramps-controller/event-handlers/analytics.ts`.
 *
 * Unlike `buildRampsTransactionCompletedProperties`, this does NOT emit
 * `provider_onramp` (not in the confirmed schema) and DOES emit `region`
 * separately from `country` when a region is provided.
 *
 * @param order - The confirmed (non-terminal) RampsOrder.
 * @param region - Optional region code from the checkout context; overrides `order.region` for the `country` field when present.
 * @param checkoutSessionId - The checkout session id, joining to the checkout funnel events.
 * @returns The `ramps-transaction-confirmed` event properties.
 */
export function buildRampsTransactionConfirmedProperties(
  order: RampsOrder,
  region?: string,
  checkoutSessionId?: string,
): Record<string, Json | undefined> {
  const cryptoAmount = Number(order.cryptoAmount);
  const totalFee = Number(order.totalFeesFiat);
  const computedExchangeRate =
    cryptoAmount > 0 ? (Number(order.fiatAmount) - totalFee) / cryptoAmount : 0;
  const country = region ?? order.region ?? '';

  return {
    ramp_type: RAMPS_RAMP_TYPE,
    ramp_routing: RAMPS_RAMP_ROUTING,
    ...(checkoutSessionId ? { checkout_session_id: checkoutSessionId } : {}),
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
    country,
    ...(region ? { region } : {}),
    currency_destination: order.cryptoCurrency?.assetId ?? '',
    currency_destination_symbol: order.cryptoCurrency?.symbol,
    currency_destination_network: order.network?.name,
    currency_source: order.fiatCurrency?.symbol ?? '',
  };
}

/**
 * `ramps-transaction-failed` shares the completed field set (mobile parity)
 * plus `error_message`.
 *
 * @param order - The failed RampsOrder.
 * @param checkoutSessionId - The checkout session id, joining to the checkout
 * funnel events.
 * @returns The `ramps-transaction-failed` event properties.
 */
export function buildRampsTransactionFailedProperties(
  order: RampsOrder,
  checkoutSessionId?: string,
): Record<string, Json | undefined> {
  return {
    ...buildRampsTransactionCompletedProperties(order, checkoutSessionId),
    error_message: order.statusDescription || 'transaction_failed',
  };
}
