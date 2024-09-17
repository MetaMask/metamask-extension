import { shallowEqual, useSelector } from 'react-redux';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import {
  getConfirmationExchangeRates,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../../selectors';

export const useAccountTotalFiatBalancesHook = () => {
  // Selectors from the Redux store
  const selectedAccount = useSelector(getSelectedAccount);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  // Fetching exchange rates from the Redux store
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const confirmationExchangeRates = useSelector(getConfirmationExchangeRates);

  // Merging exchange rates
  const mergedRates = {
    ...contractExchangeRates,
    ...confirmationExchangeRates,
  };

  // Getting total fiat balance for the account
  const accountTotalFiatBalance = useAccountTotalFiatBalance(
    selectedAccount,
    shouldHideZeroBalanceTokens,
  );

  return {
    accountTotalFiatBalance,
    mergedRates,
    loading: accountTotalFiatBalance.loading,
  };
};
