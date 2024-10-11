import React, { useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { setTokenNetworkFilter } from '../../../../../store/actions';
import {
  InternalAccountWithBalance,
  getCurrentChainId,
  getMetaMaskAccountsOrdered,
  getPreferences,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getTokenExchangeRates,
} from '../../../../../selectors';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';
import { useAccountTotalFiatBalance } from '../../../../../hooks/useAccountTotalFiatBalance';
import { getConversionRate } from '../../../../../ducks/metamask/metamask';
// import { Text } from '../../../../component-library/text/text';
// import { Box } from '../../../../component-library/box/box';

type SortControlProps = {
  handleClose: () => void;
};

const NetworkFilter = ({ handleClose }: SortControlProps) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const chainId = useSelector(getCurrentChainId);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const accounts: InternalAccountWithBalance[] = useSelector(
    getMetaMaskAccountsOrdered,
  );
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const { totalFiatBalance: selectedAccountBalance, loading } =
    useAccountTotalFiatBalance(selectedAccount, shouldHideZeroBalanceTokens);

  let multiAccountBalance = 0;
  accounts.forEach((account) => {
    const { totalFiatBalance } = useAccountTotalFiatBalance(
      account,
      shouldHideZeroBalanceTokens,
    );
    multiAccountBalance = multiAccountBalance + parseFloat(totalFiatBalance);
  });

  const handleFilter = (chainFilters: Record<string, boolean>) => {
    dispatch(setTokenNetworkFilter(chainFilters));

    // TODO Add metrics
    handleClose();
  };

  return (
    <>
      <SelectableListItem
        isSelected={!Object.keys(tokenNetworkFilter).length}
        onClick={() => handleFilter({})}
      >
        All Networks {!loading && multiAccountBalance}
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenNetworkFilter[chainId]}
        onClick={() => handleFilter({ [chainId]: true })}
      >
        Current Network {selectedAccountBalance}
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
