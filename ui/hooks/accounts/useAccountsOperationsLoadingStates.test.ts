import { useAccountsOperationsLoadingStates } from './useAccountsOperationsLoadingStates';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers';

describe('useAccountsOperationsLoadingStates', () => {
  const getState = (isSyncing: boolean) => ({
    metamask: {
      isAccountTreeSyncingInProgress: isSyncing,
    },
  });

  it('returns loading state and message when account syncing is in progress', () => {
    const { result } = renderHookWithProviderTyped(
      () => useAccountsOperationsLoadingStates(),
      getState(true),
    );
    expect(result.current.isAccountSyncingInProgress).toBe(true);
    expect(result.current.areAnyOperationsLoading).toBe(true);
    expect(result.current.loadingMessage).toBe('Syncing...');
  });

  it('returns no loading state and undefined message when no accounts operations are in progress', () => {
    const { result } = renderHookWithProviderTyped(
      () => useAccountsOperationsLoadingStates(),
      getState(false),
    );
    expect(result.current.isAccountSyncingInProgress).toBe(false);
    expect(result.current.areAnyOperationsLoading).toBe(false);
    expect(result.current.loadingMessage).toBeUndefined();
  });
});
