import { useSelector } from 'react-redux';
import { useDisplayBalanceCalc } from './useAccountBalance';
import { selectBalanceByWallet } from '../../selectors/assets';
import { useCallback, useMemo } from 'react';

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
      const balance = walletBalance.groups?.[groupId];
      if (!balance) {
        return undefined;
      }

      const displayBalance = displayBalanceCalc(
        balance?.totalBalanceInUserCurrency,
        balance?.userCurrency,
      );

      return displayBalance;
    },
    [walletBalance, displayBalanceCalc],
  );

  return getDisplayBalance;
}
