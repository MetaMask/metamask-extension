import { useEffect, useMemo, useRef, useState } from 'react';
import type { OrderBookData } from '@metamask/perps-controller';
import { getPerpsStreamManager } from '../../providers/perps';

// HyperLiquid pushes order-book diffs every ~50ms. Re-rendering the order
// entry page on every tick would (a) drown the form in layout shifts and (b)
// keep Playwright `page.screenshot` waiting for the page to settle. 500ms
// is fast enough that a typed-in amount still sees a fresh estimate within
// half a second and slow enough that the page actually stops repainting.
const ORDER_BOOK_SAMPLE_MS = 500;

export type EstimatedSlippageParams = {
  /** Market symbol (e.g. 'ETH', 'BTC'). Empty disables the hook. */
  symbol: string;
  /** Notional USD size of the prospective order. Non-positive disables the hook. */
  notionalUsd: number;
  /** Order direction. Long walks the ask side, short walks the bid side. */
  direction: 'long' | 'short';
  /**
   * When the user is on a limit order we cannot reason about market-fill
   * slippage, so the hook returns null. Kept as a flag so the caller can
   * keep the hook mounted while toggling order types.
   */
  enabled?: boolean;
};

export type EstimatedSlippageResult = {
  /** Estimated slippage as a percent (e.g. 0.5 = 0.5%). Null when not computable yet. */
  estimatedSlippagePct: number | null;
  /** True when the book is too shallow to fill the requested notional. */
  insufficientLiquidity: boolean;
};

const EMPTY_RESULT: EstimatedSlippageResult = {
  estimatedSlippagePct: null,
  insufficientLiquidity: false,
};

// Walk one side of the book until `notionalUsd` is filled and return the
// percent deviation between the volume-weighted fill price and the book's
// mid price. Exported so the pure calculation can be unit-tested without
// mocking the perps stream manager.
export function computeSlippagePct(
  orderBook: OrderBookData,
  notionalUsd: number,
  direction: 'long' | 'short',
): EstimatedSlippageResult {
  const levels = direction === 'long' ? orderBook.asks : orderBook.bids;
  const midPrice = Number.parseFloat(orderBook.midPrice);
  if (!levels.length || !Number.isFinite(midPrice) || midPrice <= 0) {
    return EMPTY_RESULT;
  }

  let remainingUsd = notionalUsd;
  let filledSize = 0;
  let filledNotional = 0;

  for (const level of levels) {
    if (remainingUsd <= 0) {
      break;
    }
    const price = Number.parseFloat(level.price);
    const size = Number.parseFloat(level.size);
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(size) ||
      size <= 0
    ) {
      continue;
    }
    const levelNotional = price * size;
    const consumeUsd = Math.min(remainingUsd, levelNotional);
    const consumeSize = consumeUsd / price;
    filledSize += consumeSize;
    filledNotional += consumeUsd;
    remainingUsd -= consumeUsd;
  }

  if (filledSize <= 0) {
    return EMPTY_RESULT;
  }

  if (remainingUsd > 0) {
    // Book exhausted before fully filling the order. Use the worst price we
    // touched as the effective fill price so callers can still surface a
    // cap-busting estimate while showing the insufficient-liquidity flag.
    return {
      estimatedSlippagePct: null,
      insufficientLiquidity: true,
    };
  }

  const avgFillPrice = filledNotional / filledSize;
  const slippageRatio =
    direction === 'long'
      ? (avgFillPrice - midPrice) / midPrice
      : (midPrice - avgFillPrice) / midPrice;
  return {
    estimatedSlippagePct: Math.max(0, slippageRatio * 100),
    insufficientLiquidity: false,
  };
}

/**
 * Compute an estimated slippage % for a prospective market order against the
 * live HyperLiquid order book. Subscribes to the same stream the order entry
 * page already uses (no extra network calls), and returns null until enough
 * data has arrived to compute a value.
 *
 * TODO(TAT-1043): mobile does not yet expose this estimate; this hook is
 * the extension-first implementation. Port to mobile in the follow-up story.
 * @param options0
 * @param options0.symbol
 * @param options0.notionalUsd
 * @param options0.direction
 * @param options0.enabled
 */
export function useEstimatedSlippage({
  symbol,
  notionalUsd,
  direction,
  enabled = true,
}: EstimatedSlippageParams): EstimatedSlippageResult {
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const lastSampleAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || !symbol) {
      setOrderBook(null);
      return undefined;
    }
    // Callers are responsible for keeping the order-book stream active for
    // `symbol`. The order entry page already does it for topOfBook on the
    // same symbol; activating again here (and deactivating on unmount with
    // no symbol arg) would race the page's lifecycle and tear the stream
    // down mid-render.
    lastSampleAtRef.current = 0;
    const stream = getPerpsStreamManager();
    const unsubscribe = stream.orderBook.subscribe((book) => {
      if (!book) {
        return;
      }
      const now = Date.now();
      if (now - lastSampleAtRef.current < ORDER_BOOK_SAMPLE_MS) {
        return;
      }
      lastSampleAtRef.current = now;
      setOrderBook(book);
    });
    return () => {
      unsubscribe();
    };
  }, [enabled, symbol]);

  return useMemo(() => {
    if (
      !enabled ||
      !orderBook ||
      !Number.isFinite(notionalUsd) ||
      notionalUsd <= 0
    ) {
      return EMPTY_RESULT;
    }
    return computeSlippagePct(orderBook, notionalUsd, direction);
  }, [enabled, orderBook, notionalUsd, direction]);
}
