import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
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

  const areAnyOperationsLoading = useMemo(() => {
    const update = () => {
      // Hack: force the patches to be applied to the state
      // Somehow, the AccountTreeController state updates are picked up by the PatchStore,
      // but not by the React-Redux subscription.
      // This forces the React-Redux subscription to pick up the changes.
      forceUpdateMetamaskState(dispatch);
      return isAccountTreeSyncingInProgress;
    };
    return update();
  }, [isAccountTreeSyncingInProgress, dispatch]);

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
