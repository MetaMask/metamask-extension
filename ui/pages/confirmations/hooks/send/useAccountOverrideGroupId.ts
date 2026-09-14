import { useSelector } from 'react-redux';
import type { AccountGroupId } from '@metamask/account-api';

import { getAccountGroupsByAddress } from '../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../selectors/multichain-accounts/account-tree.types';
import { useTransactionAccountOverride } from '../transactions/useTransactionAccountOverride';

/**
 * Resolves the account group of the transaction's pay account override.
 *
 * @returns The override account's group id, or undefined when no override is
 * active or the address cannot be resolved to a known account group.
 */
export function useAccountOverrideGroupId(): AccountGroupId | undefined {
  const accountOverride = useTransactionAccountOverride();

  return useSelector((state) => {
    if (!accountOverride) {
      return undefined;
    }

    return getAccountGroupsByAddress(state as MultichainAccountsState, [
      accountOverride,
    ])[0]?.id;
  });
}
