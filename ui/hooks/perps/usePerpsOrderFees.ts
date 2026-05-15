import { useEffect, useState, useRef } from 'react';
import type {
  FeeCalculationResult,
  OrderType,
} from '@metamask/perps-controller';

import { submitRequestToBackground } from '../../store/background-connection';

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
   * Combined fee rate (protocol + MetaMask).
   * `undefined` while loading or when the call failed entirely (error state).
   * When the call succeeds, the provider's own internal fallback to base rates
   * guarantees a numeric value even if the fee-tier API is down.
   */
  feeRate: number | undefined;
  /** Protocol (exchange) fee rate, if available */
  protocolFeeRate?: number;
  /** MetaMask builder fee rate, if available */
  metamaskFeeRate?: number;
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

  return {
    feeRate: feeResult?.feeRate,
    protocolFeeRate: feeResult?.protocolFeeRate,
    metamaskFeeRate: feeResult?.metamaskFeeRate,
    feeResult,
    isLoading,
    hasError,
  };
}
