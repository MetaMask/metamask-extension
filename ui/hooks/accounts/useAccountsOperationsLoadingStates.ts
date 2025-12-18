import { useDispatch, useSelector } from 'react-redux';
import { useMemo, useEffect } from 'react';
import { AccountTreeController } from '@metamask/account-tree-controller';
import { useI18nContext } from '../useI18nContext';
import { forceUpdateMetamaskState } from '../../store/actions';

type AppState = {
  metamask: AccountTreeController['state'];
};

export const useAccountsOperationsLoadingStates = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const isAccountTreeSyncingInProgress = useSelector(
    (state: AppState) => state.metamask.isAccountTreeSyncingInProgress,
  );

  // Hack: force the patches to be applied to the state
  // Somehow, the AccountTreeController state updates are picked up by the PatchStore,
  // but not by the React-Redux subscription.
  // This forces the React-Redux subscription to pick up the changes.
  useEffect(() => {
    forceUpdateMetamaskState(dispatch);
  }, [isAccountTreeSyncingInProgress]);

  // Since areAnyOperationsLoading just comprises isAccountTreeSyncingInProgress,
  // we can use isAccountTreeSyncingInProgress directly instead of memoizing areAnyOperationsLoading.
  // We can use useMemo when we add more loading states in the future.
  const areAnyOperationsLoading = isAccountTreeSyncingInProgress;

  // We order by priority, the first one that matches will be shown
  const loadingMessage = useMemo(() => {
    switch (true) {
      case isAccountTreeSyncingInProgress:
        return t('syncing');
      default:
        return undefined;
    }
  }, [isAccountTreeSyncingInProgress, t]);

  return {
    areAnyOperationsLoading,
    isAccountTreeSyncingInProgress,
    loadingMessage,
  };
};
