import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { selectMoneyAccountFeatureEnabled } from '../../selectors/money/money-account-feature-flags';
import { useMessenger } from '../useMessenger';

/**
 * The Money Account, as much of it as Tier 1 knows about.
 *
 * Mobile's `primaryMoneyAccount` is the `InternalAccount` held by
 * `MoneyAccountController`; every consumer of it reads `?.address`. The
 * extension has no such controller until D10, so this is the address alone
 * under the same field name. D10 can widen it to the account object without
 * touching a caller.
 */
export type MoneyAccount = {
  address: Hex;
};

/**
 * What consumers need to decide whether to render the Money surface at all.
 *
 * Same three fields as mobile's `useMoneyAccountInfo`, so consumers port
 * unchanged.
 */
export type UseMoneyAccountInfoResult = {
  /** Whether the `moneyEnableMoneyAccount` flag is on. */
  isMoneyAccountFeatureEnabled: boolean;
  /**
   * Whether there is a Money Account worth showing anything for. False until
   * proven otherwise — see the note on pending state below.
   */
  hasMoneyAccount: boolean;
  /** The Money Account, present only when `hasMoneyAccount`. */
  primaryMoneyAccount: MoneyAccount | undefined;
};

/**
 * Query key for the background availability gate. Constant: the gate takes no
 * arguments and answers for the primary seed, and it maintains its own cache
 * keyed to the unlock lifecycle.
 */
export const MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY = [
  'moneyAccountAvailability',
] as const;

const UNAVAILABLE: UseMoneyAccountInfoResult = {
  isMoneyAccountFeatureEnabled: false,
  hasMoneyAccount: false,
  primaryMoneyAccount: undefined,
};

/**
 * Whether this user has a Money Account, and its address when they do.
 *
 * ## What "has" means
 *
 * The feature flag is on and the wallet derives a money address. Visibility is
 * deliberately not gated on the account being upgraded — an upgrade flow is
 * planned, so a not-yet-upgraded user should still see the surface that leads
 * them there.
 *
 * That determination — flag plus derived address — belongs to the background's
 * `MoneyAccountAvailabilityService`, which caches the derivation per unlock.
 * This hook does not re-derive any part of it.
 *
 * ## Pending state
 *
 * The gate is asynchronous, so there is a window on first mount where the
 * answer is not known yet. During it, `hasMoneyAccount` is `false` and there is
 * no address: unknown is reported as absent, so the Money surface cannot flash
 * on and then disappear (or worse, render against no address). No separate
 * loading flag is exposed, deliberately — under the "sees nothing" rule there
 * is no third state to render, and a `isLoading` field would only invite a
 * consumer to distinguish one.
 *
 * The trade is that a user who does have a money account sees the surface
 * appear a beat late. That is the correct direction to be wrong in.
 *
 * @returns The feature flag, whether a money account exists, and its address.
 */
export function useMoneyAccountInfo(): UseMoneyAccountInfoResult {
  const isMoneyAccountFeatureEnabled = useSelector(
    selectMoneyAccountFeatureEnabled,
  );
  const messenger = useMessenger();

  // Skipped entirely when the flag is off, mirroring the background gate's own
  // ordering: a flag-off user costs no seed access and no RPC.
  const { data: availability } = useQuery({
    queryKey: MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY,
    queryFn: () =>
      messenger.call('MoneyAccountAvailabilityService:getAvailability'),
    enabled: isMoneyAccountFeatureEnabled,
  });

  if (!isMoneyAccountFeatureEnabled) {
    // A disabled query keeps serving whatever it last cached, so the flag is
    // required here too rather than trusted to have been folded in upstream.
    // Turning the flag off hides the surface on the next render, not on the
    // next refetch.
    return UNAVAILABLE;
  }

  return {
    isMoneyAccountFeatureEnabled,
    hasMoneyAccount: availability?.isAvailable ?? false,
    primaryMoneyAccount: availability?.isAvailable
      ? { address: availability.address }
      : undefined,
  };
}

export default useMoneyAccountInfo;
