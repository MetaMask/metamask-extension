import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AccountWalletId } from '@metamask/account-api';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import { useHdKeyringsWithSnapAccounts } from '../multi-srp/useHdKeyringsWithSnapAccounts';
import { getMultichainAccountsByWalletId } from '../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';
import { getIsPrimarySeedPhraseBackedUp } from '../../ducks/metamask/metamask';
import { stripWalletTypePrefixFromWalletId } from './utils';

/**
 * Hook that provides comprehensive wallet information including accounts, keyring ID and backup status.
 *
 * @param walletId - ID of a wallet.
 * @returns Object containing multichain accounts, keyringId and isSRPBackedUp.
 */
export const useWalletInfo = (walletId: AccountWalletId) => {
  const hdKeyringsWithSnapAccounts = useHdKeyringsWithSnapAccounts();
  const globalSRPBackedUp = useSelector(getIsPrimarySeedPhraseBackedUp);
  const rawMultichainAccounts = useSelector((state: MultichainAccountsState) =>
    getMultichainAccountsByWalletId(state, walletId),
  );
  const multichainAccounts: AccountGroupObject[] = Object.values(
    rawMultichainAccounts ?? {},
  );

  return useMemo(() => {
    if (Object.entries(multichainAccounts || {}).length === 0) {
      return {
        multichainAccounts,
        keyringId: undefined,
      };
    }

    // Find which HD keyring this wallet belongs to using the first account
    const keyringIndex = hdKeyringsWithSnapAccounts.findIndex(
      (keyring) =>
        keyring.metadata.id === stripWalletTypePrefixFromWalletId(walletId),
    );

    if (keyringIndex === -1) {
      return {
        multichainAccounts,
        keyringId: undefined,
      };
    }

    const keyring = hdKeyringsWithSnapAccounts[keyringIndex];
    const keyringId = keyring?.metadata.id ?? undefined;

    const srpIndex = keyringIndex + 1;

    // Only return backup status for the primary SRP (index 1) since the current
    // backup tracking system only tracks the primary SRP, not individual SRPs.
    // For all other SRPs, we don't return backup status to avoid showing incorrect information.
    const isSRPBackedUp = srpIndex === 1 ? globalSRPBackedUp : undefined;

    return {
      multichainAccounts,
      keyringId,
      isSRPBackedUp,
    };
  }, [
    multichainAccounts,
    hdKeyringsWithSnapAccounts,
    globalSRPBackedUp,
    walletId,
  ]);
};
