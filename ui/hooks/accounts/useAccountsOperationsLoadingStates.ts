import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import { AccountTreeController } from '@metamask/account-tree-controller';
import { useI18nContext } from '../useI18nContext';

type AppState = {
  metamask: AccountTreeController['state'];
};

export const useAccountsOperationsLoadingStates = () => {
  const t = useI18nContext();
  const isAccountSyncingInProgress = useSelector(
    (state: AppState) => state.metamask.isAccountTreeSyncingInProgress,
  );

  const areAnyOperationsLoading = useMemo(
    () => isAccountSyncingInProgress,
    [isAccountSyncingInProgress],
  );

  // We order by priority, the first one that matches will be shown
  const loadingMessage = useMemo(() => {
    switch (true) {
      case isAccountSyncingInProgress:
        return t('syncing');
      default:
        return undefined;
    }
  }, [isAccountSyncingInProgress]);

  return {
    areAnyOperationsLoading,
    isAccountSyncingInProgress,
    loadingMessage,
  };
};
