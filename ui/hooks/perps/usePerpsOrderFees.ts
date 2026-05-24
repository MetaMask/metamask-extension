import { useEffect, useMemo, useState, useRef } from 'react';
import type {
  FeeCalculationResult,
  OrderType,
} from '@metamask/perps-controller';

import { submitRequestToBackground } from '../../store/background-connection';
import { usePerpsMetamaskFeeDiscountBips } from './usePerpsMetamaskFeeDiscountBips';

/** Basis-point denominator: 10000 bips = 100%. */
const BASIS_POINTS_DIVISOR = 10000;

type UsePerpsOrderFeesOptions = {
  /** Asset symbol (e.g. 'BTC', 'ETH', 'xyz:TSLA') */
  symbol: string;
  /** Order type */
  orderType: OrderType;
  /** Notional amount in USD as a string (passed to calculateFees for fee amount) */
  amount?: string;
  /** Whether this is a maker order (limit order resting on book). Defaults to false. */
  isMaker?: boolean;
};

type UsePerpsOrderFeesReturn = {
  /**
   * Combined fee rate (protocol + MetaMask) **after** any VIP discount.
   * `undefined` while loading or when the call failed entirely (error state).
   * When the call succeeds, the provider's own internal fallback to base rates
   * guarantees a numeric value even if the fee-tier API is down.
   */
  feeRate: number | undefined;
  /**
   * Combined fee rate **before** the MetaMask VIP discount is applied.
   * Equals `feeRate` when no discount is in effect. Consumers use this to
   * display a struck-through "original" fee alongside the discounted one.
   */
  undiscountedFeeRate: number | undefined;
  /** Protocol (exchange) fee rate, if available */
  protocolFeeRate?: number;
  /** MetaMask builder fee rate, if available */
  metamaskFeeRate?: number;
  /**
   * Fee discount in whole percentage points .
   * `undefined` when no discount is in effect or when the lookup hasn't completed yet,
   * so callers can skip rendering the badge entirely.
   */
  metamaskFeeRateDiscountPercentage: number | undefined;
  /** Full result from the controller, if available */
  feeResult?: FeeCalculationResult;
  /** Whether the async fee fetch is in progress */
  isLoading: boolean;
  /** True when the calculateFees call failed at the RPC/controller level */
  hasError: boolean;
};

const FALLBACK_FEE_RATES = {
  feeRate: 0.00145,
  protocolFeeRate: 0.00045,
  metamaskFeeRate: 0.001,
} as const;

/**
 * Un-discounted MetaMask builder fee expressed in basis points. Derived from
 * the decimal fallback rate so the two stay in sync (0.001 decimal = 10 bps).
 */
const ORIGINAL_METAMASK_FEE_BIPS = FALLBACK_FEE_RATES.metamaskFeeRate * 10000;

function createFallbackFeeResult(amount?: string): FeeCalculationResult {
  const parsedAmount = Number.parseFloat(amount ?? '');
  const notional = Number.isFinite(parsedAmount) ? parsedAmount : 0;

  return {
    ...FALLBACK_FEE_RATES,
    feeAmount: notional * FALLBACK_FEE_RATES.feeRate,
    protocolFeeAmount: notional * FALLBACK_FEE_RATES.protocolFeeRate,
    metamaskFeeAmount: notional * FALLBACK_FEE_RATES.metamaskFeeRate,
  };
}

/**
 * Fetches dynamic fee rates from the controller's calculateFees pipeline.
 *
 * Mirrors mobile's usePerpsOrderFees: calls PerpsController.calculateFees
 * through the background, which routes to HyperLiquidProvider.calculateFees.
 * That method fetches user-specific rates (volume tiers, referral/staking
 * discounts, HIP-3 multipliers) and adds the MetaMask builder fee. If the
 * fee-tier API is unreachable, the *provider* falls back to base rates
 * internally (0.00045 taker + 0.001 builder = 0.00145), so a successful
 * RPC response always contains a usable feeRate.
 *
 * If the entire calculateFees RPC call fails (background unreachable,
 * controller throws, etc.) the hook enters an error state with
 * `feeRate: undefined` and `hasError: true` — matching mobile, which shows
 * an error/zero state rather than silently using a hardcoded constant.
 *
 * @param options - Fee calculation parameters
 * @param options.symbol - Asset symbol (e.g. 'BTC', 'ETH', 'xyz:TSLA')
 * @param options.orderType - Order type ('market' or 'limit')
 * @param options.amount - Notional amount in USD as a string
 * @param options.isMaker - Whether this is a maker order. Defaults to false.
 * @returns Fee rates, loading state, and error flag
 */
export function usePerpsOrderFees({
  symbol,
  orderType,
  amount,
  isMaker = false,
}: UsePerpsOrderFeesOptions): UsePerpsOrderFeesReturn {
  const [feeResult, setFeeResult] = useState<FeeCalculationResult | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;
    let cancelled = false;
    const fallbackTimeout = window.setTimeout(() => {
      if (!cancelled && currentRequestId === requestIdRef.current) {
        setFeeResult(createFallbackFeeResult(amount));
        setIsLoading(false);
      }
    }, 1500);

    setFeeResult(undefined);
    setIsLoading(true);
    setHasError(false);

    submitRequestToBackground<FeeCalculationResult>('perpsCalculateFees', [
      { orderType, isMaker, amount, symbol },
    ])
      .then((result) => {
        if (!cancelled && currentRequestId === requestIdRef.current) {
          window.clearTimeout(fallbackTimeout);
          setFeeResult(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled && currentRequestId === requestIdRef.current) {
          window.clearTimeout(fallbackTimeout);
          setFeeResult(createFallbackFeeResult(amount));
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimeout);
    };
  }, [symbol, orderType, amount, isMaker]);

  const metamaskFeeDiscountBips = usePerpsMetamaskFeeDiscountBips(
    ORIGINAL_METAMASK_FEE_BIPS,
  );

  // The core perps-controller only applies the MetaMask fee discount inside
  // trading operations (placeOrder, closePosition, ...); its `calculateFees`
  // returns un-discounted rates. Apply the discount here so consumers see a
  // consistent fee — matching the `-X%` badge surfaced via
  // `metamaskFeeRateDiscountPercentage`.
  const discountedFeeResult = useMemo<FeeCalculationResult | undefined>(() => {
    if (!feeResult) {
      return feeResult;
    }
    if (
      metamaskFeeDiscountBips === undefined ||
      metamaskFeeDiscountBips <= 0 ||
      feeResult.metamaskFeeRate === undefined
    ) {
      return feeResult;
    }
    const factor = 1 - metamaskFeeDiscountBips / BASIS_POINTS_DIVISOR;
    const discountedMetamaskFeeRate = feeResult.metamaskFeeRate * factor;
    const discountedMetamaskFeeAmount =
      feeResult.metamaskFeeAmount === undefined
        ? undefined
        : feeResult.metamaskFeeAmount * factor;
    const discountedFeeRate =
      feeResult.protocolFeeRate === undefined
        ? discountedMetamaskFeeRate
        : feeResult.protocolFeeRate + discountedMetamaskFeeRate;
    const discountedFeeAmount =
      feeResult.protocolFeeAmount !== undefined &&
      discountedMetamaskFeeAmount !== undefined
        ? feeResult.protocolFeeAmount + discountedMetamaskFeeAmount
        : discountedMetamaskFeeAmount;
    return {
      ...feeResult,
      feeRate: discountedFeeRate,
      feeAmount: discountedFeeAmount,
      metamaskFeeRate: discountedMetamaskFeeRate,
      metamaskFeeAmount: discountedMetamaskFeeAmount,
    };
  }, [feeResult, metamaskFeeDiscountBips]);

  // Convert bips to a whole-percentage value at the display boundary only —
  // PerpsFeesDisplay and analogous consumers render `-X%` in the discount badge.
  const metamaskFeeRateDiscountPercentage =
    metamaskFeeDiscountBips === undefined
      ? undefined
      : metamaskFeeDiscountBips / 100;

  return {
    feeRate: discountedFeeResult?.feeRate,
    undiscountedFeeRate: feeResult?.feeRate,
    protocolFeeRate: discountedFeeResult?.protocolFeeRate,
    metamaskFeeRate: discountedFeeResult?.metamaskFeeRate,
    metamaskFeeRateDiscountPercentage,
    feeResult: discountedFeeResult,
    isLoading,
    hasError,
  };
}
