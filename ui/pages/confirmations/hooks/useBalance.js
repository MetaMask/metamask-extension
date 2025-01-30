import { useSelector } from 'react-redux';
import {
  getCurrentNetwork,
  getInternalAccountByAddress,
  getSelectedAccountCachedBalance,
  getShouldHideZeroBalanceTokens,
  getShowFiatInTestnets,
} from '../../../selectors';
import { TEST_NETWORKS } from '../../../../shared/constants/network';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';

export const useBalance = (fromAddress) => {
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const fromAccount = useSelector((state) =>
    getInternalAccountByAddress(state, fromAddress),
  );

  const { totalWeiBalance } = useAccountTotalFiatBalance(
    fromAccount,
    shouldHideZeroBalanceTokens,
  );

  const currentNetwork = useSelector(getCurrentNetwork);

  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    TEST_NETWORKS.includes(currentNetwork?.nickname) && !showFiatInTestnets;

  let balanceToUse = totalWeiBalance;

  const balance = useSelector(getSelectedAccountCachedBalance);

  if (!fromAddress) {
    return {};
  }

  if (showFiat) {
    balanceToUse = balance;
  }

  return { balance: balanceToUse };
};
