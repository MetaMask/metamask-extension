import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import type { AddressBookEntry } from '@metamask/address-book-controller';
import type { TokenListMap } from '@metamask/assets-controllers';
import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../shared/lib/hexstring-utils';
import { shortenAddress } from '../helpers/utils/util';
import { getCompleteAddressBook, getTokenList } from '../selectors';
import { getAccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree';
import type { AccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree.types';

const selectAccountNameByAddress = createSelector(
  getAccountGroupWithInternalAccounts,
  (accountGroups: AccountGroupWithInternalAccounts[]) => {
    const map = new Map<string, string>();
    for (const group of accountGroups) {
      const name = group.metadata?.name;
      if (!name) {
        continue;
      }
      for (const account of group.accounts) {
        map.set(account.address.toLowerCase(), name);
      }
    }
    return map;
  },
);

const selectContactNameByAddress = createSelector(
  getCompleteAddressBook,
  (addressBook: AddressBookEntry[]) => {
    const map = new Map<string, string>();
    for (const entry of addressBook) {
      const key = entry.address.toLowerCase();
      if (!map.has(key) && entry.name) {
        map.set(key, entry.name);
      }
    }
    return map;
  },
);

/**
 * Returns a callback that resolves an address to a display name.
 */
export function useGetDisplayName() {
  const accountNames = useSelector(selectAccountNameByAddress);
  const contactNames = useSelector(selectContactNameByAddress);
  const tokenList = useSelector(getTokenList) as TokenListMap;

  return useCallback(
    (address?: string) => {
      if (!address) {
        return '';
      }

      // Non-EVM addresses must not go through hex helpers
      const key = address.toLowerCase();

      return (
        accountNames.get(key) ||
        contactNames.get(key) ||
        tokenList[key]?.name ||
        shortenAddress(
          isValidHexAddress(address) ? toChecksumHexAddress(address) : address,
        )
      );
    },
    [accountNames, contactNames, tokenList],
  );
}
