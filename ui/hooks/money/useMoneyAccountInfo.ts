import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import type { MoneyAccountAvailability } from '../../../shared/lib/money/availability';
import { selectMoneyAccountFeatureEnabled } from '../../selectors/money-account-feature-flags';
import {
  selectPrimaryMoneyAccount,
  type PrimaryMoneyAccount,
} from '../../selectors/money-account';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * The Money Account.
 *
 * Mobile's `primaryMoneyAccount` is the account object held by
 * `MoneyAccountController`; every consumer of it reads `?.address`.
 *
 * The address is always present, because the availability gate derives it from
 * the seed and will not report an available account without one. The rest of
 * the account object is whatever `MoneyAccountController` holds, and is
 * `undefined` until it has created the keyring — which the gate does not wait
 * for, so there is a window where the account is known to be usable but the
 * controller has not caught up. Modelling that as optional keeps the address,
 * which is all any current consumer reads, unconditional.
 */
export type MoneyAccount = {
  address: Hex;
} & Partial<Omit<PrimaryMoneyAccount, 'address'>>;

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
 * A user whose money account has never been upgraded has no money account as
 * far as the extension is concerned: the extension does not implement the
 * upgrade, so an un-upgraded address is one it can neither read a vault
 * position for nor deposit from. Such a user sees **nothing** — not a disabled
 * control, not a zero balance. So `hasMoneyAccount` folds in the EIP-7702
 * delegation check, and an unavailable account is indistinguishable here from
 * no account at all.
 *
 * That whole determination — flag, derived address, delegation — belongs to the
 * background's `MoneyAccountAvailabilityService`, which caches it per unlock
 * rather than putting an `eth_getCode` behind a boolean the UI asks for on
 * every render. This hook does not re-derive any part of it.
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

  // The controller's account, when it has one. Never a substitute for the gate:
  // a created keyring says nothing about whether the account was upgraded, so
  // it cannot decide `hasMoneyAccount`.
  const primaryMoneyAccount = useSelector(selectPrimaryMoneyAccount);

  // Skipped entirely when the flag is off, mirroring the background gate's own
  // ordering: a flag-off user costs no seed access and no RPC.
  const { data: availability } = useQuery({
    queryKey: MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY,
    queryFn: () =>
      submitRequestToBackground<MoneyAccountAvailability>(
        'getMoneyAccountAvailability',
      ),
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
      ? // The gate's address is authoritative. It and the controller derive
        // the same address from the same seed, so this cannot mask a
        // disagreement — it just does not depend on the controller having run.
        { ...primaryMoneyAccount, address: availability.address }
      : undefined,
  };
}

export default useMoneyAccountInfo;
