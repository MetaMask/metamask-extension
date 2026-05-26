import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { CaipAccountId } from '@metamask/utils';
import { parseCaipChainId, toCaipAccountId } from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';

import { submitRequestToBackground } from '../../store/background-connection';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { getIsVipProgramEnabled } from '../../selectors/perps/feature-flags';

/**
 * Cache TTL for the per-address fee discount lookup. Mirrors mobile's
 * `PERFORMANCE_CONFIG.FeeDiscountCacheDurationMs` (5 minutes).
 */
const FEE_DISCOUNT_CACHE_TTL_MS = 1000 * 60 * 5;

type FeeDiscountCacheEntry = {
  caipAccountId: CaipAccountId;
  discountBips: number;
  timestamp: number;
};

let feeDiscountCache: FeeDiscountCacheEntry | null = null;

/** Test-only: wipe the module-level fee discount cache so tests start clean. */
export function clearPerpsFeeDiscountCacheForTests(): void {
  feeDiscountCache = null;
}

function formatAccountToCaipAccountId(
  address: string,
  chainId: string,
): CaipAccountId | null {
  try {
    const decimal = chainId.startsWith('0x')
      ? Number.parseInt(chainId, 16)
      : Number.parseInt(chainId, 10);
    if (!Number.isFinite(decimal)) {
      return null;
    }
    const caipChainId = `eip155:${decimal}` as `${string}:${string}`;
    const { namespace, reference } = parseCaipChainId(caipChainId);
    const normalizedAddress =
      namespace === 'eip155' ? toChecksumHexAddress(address) : address;
    return toCaipAccountId(namespace, reference, normalizedAddress);
  } catch {
    return null;
  }
}

/**
 * Maximum discount expressible in basis points (10000 bips = 100%). The
 * rewards controller can in theory return a larger number for misconfigured
 * subscriptions; we clamp here so downstream math never produces a negative
 * post-discount fee rate.
 */
const MAX_DISCOUNT_BIPS = 10000;

/**
 * Reads the current MetaMask perps fee discount for the selected account from
 * `RewardsController.getPerpsDiscountForAccount` and exposes it in **basis
 * points** (e.g. `5000` for 50% off). The lookup is cached per address for
 * {@link FEE_DISCOUNT_CACHE_TTL_MS} so re-renders don't hammer the data service.
 *
 * Bips is the native unit used by the rewards controller and by the
 * HyperLiquid provider (`setUserFeeDiscount(bips)`), so callers can apply the
 * discount directly via `rate * (1 - bips / 10000)` without an intermediate
 * percentage round-trip. Convert to percentage at the display boundary only.
 *
 * Returns `undefined` whenever a discount is not in effect:
 * - no selected EVM account
 * - chain id can't be formatted to a CAIP-10 account id
 * - the controller returns `null` (rewards disabled, subscription not
 * hydrated, upstream fetch error)
 * - the controller throws
 * - the controller returns `0` bips
 *
 * Callers can rely on `undefined` to mean "don't apply or display a
 * discount" without needing additional gating.
 *
 * @param baseFeeBips - Un-discounted MetaMask builder fee in basis points
 * that the caller would apply absent any discount. The controller uses this
 * as the denominator when turning the VIP absolute fee into a discount
 * fraction.
 * @returns Discount in basis points (capped at {@link MAX_DISCOUNT_BIPS}) or
 * `undefined`.
 */
export function usePerpsMetamaskFeeDiscountBips(
  baseFeeBips: number,
): number | undefined {
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const currentChainId = useSelector(getCurrentChainId);
  const isVipProgramEnabled = useSelector(getIsVipProgramEnabled);

  const [discountBips, setDiscountBips] = useState<number | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    if (!isVipProgramEnabled || !selectedAddress) {
      setDiscountBips(undefined);
      return undefined;
    }

    const caipAccountId = formatAccountToCaipAccountId(
      selectedAddress,
      currentChainId,
    );
    if (!caipAccountId) {
      setDiscountBips(undefined);
      return undefined;
    }

    const now = Date.now();
    if (
      feeDiscountCache?.caipAccountId === caipAccountId &&
      now - feeDiscountCache.timestamp < FEE_DISCOUNT_CACHE_TTL_MS
    ) {
      setDiscountBips(feeDiscountCache.discountBips);
      return undefined;
    }

    // Clear the previous account's discount immediately so downstream memos
    // don't apply a stale discount while the new fetch is in flight.
    setDiscountBips(undefined);

    submitRequestToBackground<number | null>(
      'rewardsGetPerpsDiscountForAccount',
      [caipAccountId, baseFeeBips],
    )
      .then((bips) => {
        if (cancelled) {
          return;
        }
        // `null` means the discount is currently unknowable (rewards disabled,
        // subscription not yet hydrated, fetch error). Don't cache.
        if (bips === null) {
          setDiscountBips(undefined);
          return;
        }
        feeDiscountCache = {
          caipAccountId,
          discountBips: bips,
          timestamp: Date.now(),
        };
        setDiscountBips(bips);
      })
      .catch(() => {
        if (!cancelled) {
          setDiscountBips(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isVipProgramEnabled, selectedAddress, currentChainId, baseFeeBips]);

  return discountBips !== undefined && discountBips > 0
    ? Math.min(discountBips, MAX_DISCOUNT_BIPS)
    : undefined;
}
