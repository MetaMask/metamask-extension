import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import {
  useDeleteAccountSyncingDataFromUserStorage,
  useSyncAccounts,
} from './accountSyncing';

describe('useDeleteAccountSyncingDataFromUserStorage()', () => {
  it('should dispatch account sync data deletion', async () => {
    const mockDeleteAccountSyncAction = jest.spyOn(
      actions,
      'deleteAccountSyncingDataFromUserStorage',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDeleteAccountSyncingDataFromUserStorage(),
      {},
    );

    await result.current.dispatchDeleteAccountData();
    expect(mockDeleteAccountSyncAction).toHaveBeenCalled();
  });
});

describe('useSyncAccounts', () => {
  const arrangeMocks = () => {
    const mockSyncAccountsAction = jest.spyOn(
      actions,
      'syncInternalAccountsWithUserStorage',
    );

    return {
      mockSyncAccountsAction,
    };
  };

  it('should dispatch sync accounts when called', async () => {
    const mocks = arrangeMocks();
    const hook = renderHookWithProviderTyped(() => useSyncAccounts(), {});
    await hook.result.current();
    expect(mocks.mockSyncAccountsAction).toHaveBeenCalled();
  });
});
