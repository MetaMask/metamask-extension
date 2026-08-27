import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { selectMoneyAccountFeatureEnabled } from '../../selectors/money/money-account-feature-flags';
import type { RouteMessengerInstance } from '../../pages/money/messenger';
import {
  selectPrimaryMoneyAccount,
  type PrimaryMoneyAccount,
} from '../../selectors/money-account';
import { useMessenger } from '../useMessenger';

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

export type UseMoneyAccountInfoResult = {
  isMoneyAccountFeatureEnabled: boolean;
  hasMoneyAccount: boolean;
  /** The Money Account, present only when `hasMoneyAccount`. */
  primaryMoneyAccount: MoneyAccount | undefined;
};

/**
 * Query key for the background availability gate.
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
 * @returns The feature flag, whether a money account exists, and its address.
 */
export function useMoneyAccountInfo(): UseMoneyAccountInfoResult {
  const isMoneyAccountFeatureEnabled = useSelector(
    selectMoneyAccountFeatureEnabled,
  );
  const messenger = useMessenger<RouteMessengerInstance>();

  // The controller's account, when it has one. Never a substitute for the gate:
  // a created keyring says nothing about whether the account was upgraded, so
  // it cannot decide `hasMoneyAccount`.
  const primaryMoneyAccount = useSelector(selectPrimaryMoneyAccount);

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
    // required here too
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
