import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { AccountWalletId } from '@metamask/account-api';
import { getWalletStatus } from '../../selectors/multichain-accounts/account-tree';
import { useI18nContext } from '../useI18nContext';
import { useAccountsOperationsLoadingStates } from './useAccountsOperationsLoadingStates';

export const useAccountsWalletOperationsLoadingStates = (
  walletId: AccountWalletId,
) => {
  const t = useI18nContext();

  const {
    isAccountTreeSyncingInProgress,
    areAnyOperationsLoading: areAnyAccountsOperationsLoading,
    loadingMessage: accountsOperationsLoadingMessage,
  } = useAccountsOperationsLoadingStates();

  const walletStatus = useSelector((state) => getWalletStatus(state, walletId));

  // We order by priority, the first one that matches will be shown
  const loadingMessage = useMemo(() => {
    // Any global operations on accounts take precedence over the wallet status.
    if (isAccountTreeSyncingInProgress) {
      return accountsOperationsLoadingMessage;
    }

    if (walletStatus !== null) {
      switch (walletStatus) {
        case 'in-progress:alignment':
          // We use the same copy as discovery for this one, mainly cause alignment is
          // an internal and technical operation.
          return t('discoveringMultichainAccountButtonLoading');
        case 'in-progress:discovery':
          return t('discoveringMultichainAccountButtonLoading');
        case 'in-progress:create-accounts':
          return t('createMultichainAccountButtonLoading');
        default:
          return undefined;
      }
    }

    return undefined;
  }, [
    isAccountTreeSyncingInProgress,
    walletStatus,
    accountsOperationsLoadingMessage,
    t,
  ]);

  // If we have any valid message, then the wallet is busy with an operation.
  const isWalletOperationLoading = loadingMessage?.length > 0;

  // If there's any valid loading message, then an operation is on-going.
  const areAnyOperationsLoading = useMemo(
    () => areAnyAccountsOperationsLoading || isWalletOperationLoading,
    [areAnyAccountsOperationsLoading, isWalletOperationLoading],
  );

  return {
    areAnyOperationsLoading,
    loadingMessage,
  };
};
