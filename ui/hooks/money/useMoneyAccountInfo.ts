import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { selectMoneyAccountFeatureEnabled } from '../../selectors/money/money-account-feature-flags';
import type { RouteMessengerInstance } from '../../pages/money/messenger';
import { useMessenger } from '../useMessenger';

export type MoneyAccount = {
  address: Hex;
};

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

  // Skipped entirely when the flag is off
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
      ? { address: availability.address }
      : undefined,
  };
}

export default useMoneyAccountInfo;
