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
import { useMultichainAccountTotalFiatBalance } from '../../../../../hooks/useMultichainAccountTotalFiatBalance';
import { getMultichainBalances } from '../../../../../selectors/multichain';
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

  const balances = useSelector(getMultichainBalances);
  console.log('BALANCES: ', balances);

  const { totalFiatBalance: selectedAccountBalance, loading } =
    useAccountTotalFiatBalance(selectedAccount, shouldHideZeroBalanceTokens);

  // TODO: fetch balances across networks
  // const multiNetworkAccountBalance = useMultichainAccountBalance()

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
        All Networks
      </SelectableListItem>
      <SelectableListItem
        isSelected={tokenNetworkFilter[chainId]}
        onClick={() => handleFilter({ [chainId]: true })}
      >
        Current Network {!loading && selectedAccountBalance}
      </SelectableListItem>
    </>
  );
};

export default NetworkFilter;
