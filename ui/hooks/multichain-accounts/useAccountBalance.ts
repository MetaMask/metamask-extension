import { useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import { selectBalanceForAllWallets } from '../../selectors/assets';
import { formatWithThreshold } from '../../components/app/assets/util/formatWithThreshold';
import { getCurrentCurrency } from '../../ducks/metamask/metamask';
import { getIntlLocale } from '../../ducks/locale/locale';
import { getAccountTree } from '../../selectors/multichain-accounts/account-tree';

export function useDisplayBalanceCalc() {
  const fallbackCurrency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const displayBalanceCalc = useCallback(
    (balance: number = 0, currency: string = fallbackCurrency) => {
      const displayBalance = formatWithThreshold(balance, 0.01, locale, {
        style: 'currency',
        currency: currency,
      });

      return displayBalance;
    },
    [],
  );

  return displayBalanceCalc;
}

/**
 * Returns a callback that can be used to get the display balance.
 * @returns callback that will get the display balance
 */
export function useAccountBalanceCallback() {
  const allBalances = useSelector(selectBalanceForAllWallets);
  const displayBalanceCalc = useDisplayBalanceCalc();

  const getDisplayBalance = useCallback(
    (walletId: string, groupId: string) => {
      if (!allBalances) {
        return undefined;
      }

      const balance = allBalances?.wallets?.[walletId]?.groups?.[groupId];

      if (!balance) {
        return undefined;
      }

      const displayBalance = displayBalanceCalc(
        balance?.totalBalanceInUserCurrency,
        balance?.userCurrency,
      );

      return displayBalance;
    },
    [allBalances, displayBalanceCalc],
  );

  return getDisplayBalance;
}

type WalletBalances = Partial<{
  [walletId: string]: Partial<{
    [groupId: string]: string; // balance
  }>;
}>;

export function useAllWalletAccountsBalances(): WalletBalances {
  const accountTree = useSelector(getAccountTree);
  const { wallets } = accountTree;
  const getDisplayBalance = useAccountBalanceCallback();

  const walletBalances = useMemo(() => {
    const result: WalletBalances = {};
    Object.entries(wallets || {}).forEach(([walletId, walletData]) => {
      Object.keys(walletData.groups || {}).forEach((groupId) => {
        result[walletId] ??= {};
        result[walletId][groupId] = getDisplayBalance(walletId, groupId);
      });
    });
    return result;
  }, [getDisplayBalance]);

  return walletBalances;
}
