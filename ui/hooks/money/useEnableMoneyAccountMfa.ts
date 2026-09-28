import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../store/background-connection';
import { selectPrimaryMoneyAccount } from '../../selectors/money-account';
import { isMpcBackedMoneyAccount } from '../../../shared/lib/money/mpc-money-account';
import { MoneyAccountAvailabilityServiceQueryKeys } from './query-keys';
import { MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY } from './useMoneyAccountInfo';

const ENABLE_MFA_ACTION = 'MoneyAccountMpcService:enableMfa';

/**
 * Enables MFA for the Money Account: creates an MPC keyring account and
 * migrates the money account onto that address.
 *
 * @returns The action, whether a migration is in flight, whether MFA is
 * already on, and the last error message.
 */
export function useEnableMoneyAccountMfa() {
  const queryClient = useQueryClient();
  const primaryMoneyAccount = useSelector(selectPrimaryMoneyAccount);
  const isEnabled = isMpcBackedMoneyAccount(primaryMoneyAccount);
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const enableMfa = useCallback(async () => {
    setIsEnabling(true);
    setError(undefined);
    try {
      await submitRequestToBackground('messengerCall', [ENABLE_MFA_ACTION, []]);
      await queryClient.invalidateQueries({
        queryKey: MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY,
      });
      await queryClient.invalidateQueries({
        queryKey: [MoneyAccountAvailabilityServiceQueryKeys.GetAvailability],
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to enable MFA');
    } finally {
      setIsEnabling(false);
    }
  }, [queryClient]);

  return { enableMfa, isEnabling, isEnabled, error };
}
