import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectBalanceByWallet } from '../../selectors/assets';
import { getAccountGroupDisplayBalance } from '../../helpers/utils/account-group-balance';
import { useDisplayBalanceCalc } from './useAccountBalance';

export function useSingleWalletDisplayBalance(walletId: string) {
  const selector = useMemo(() => selectBalanceByWallet(walletId), [walletId]);
  const walletBalance = useSelector(selector);
  const displayBalanceCalc = useDisplayBalanceCalc();

  return displayBalanceCalc(
    walletBalance.totalBalanceInUserCurrency,
    walletBalance.userCurrency,
  );
}

export function useSingleWalletAccountsBalanceCallback(walletId: string) {
  const selector = useMemo(() => selectBalanceByWallet(walletId), [walletId]);
  const walletBalance = useSelector(selector);
  const displayBalanceCalc = useDisplayBalanceCalc();

  const getDisplayBalance = useCallback(
    (groupId: string) => {
      // Undefined when this group has no known balance yet, so nothing is
      // rendered instead of a misleading "$0.00".
      const groupBalance = getAccountGroupDisplayBalance(
        walletBalance.groups?.[groupId],
      );

      return (
        groupBalance &&
        displayBalanceCalc(groupBalance.amount, groupBalance.currency)
      );
    },
    [walletBalance, displayBalanceCalc],
  );

  return getDisplayBalance;
}
