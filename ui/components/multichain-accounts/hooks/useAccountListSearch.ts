import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getNormalizedGroupsMetadata } from '../../../selectors/multichain-accounts/account-tree';
import { AccountTreeWallets } from '../../../selectors/multichain-accounts/account-tree.types';
import { filterWalletsByGroupNameOrAddress } from '../../../pages/multichain-accounts/account-list/utils';

type UseAccountListSearchReturn = {
  searchPattern: string;
  onSearchBarChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  filteredWallets: AccountTreeWallets;
  hasFilteredWallets: boolean;
  isInSearchMode: boolean;
};

/**
 * Manages account list search state and returns wallets filtered by group name
 * or address.
 *
 * @param wallets - The wallets collection to filter.
 * @returns Search state, handlers, and filtered wallet data for account list UIs.
 */
export function useAccountListSearch(
  wallets: AccountTreeWallets,
): UseAccountListSearchReturn {
  const [searchPattern, setSearchPattern] = useState('');
  const groupsMetadata = useSelector(getNormalizedGroupsMetadata);

  const onSearchBarChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchPattern(event.target.value);
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchPattern('');
  }, []);

  const filteredWallets = useMemo(
    () =>
      filterWalletsByGroupNameOrAddress(wallets, searchPattern, groupsMetadata),
    [wallets, searchPattern, groupsMetadata],
  );

  const hasFilteredWallets = useMemo(
    () => Object.keys(filteredWallets).length > 0,
    [filteredWallets],
  );

  return {
    searchPattern,
    onSearchBarChange,
    clearSearch,
    filteredWallets,
    hasFilteredWallets,
    isInSearchMode: Boolean(searchPattern),
  };
}
