import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import {
  useDeleteNetworkSyncingDataFromUserStorage,
  useSyncNetworks,
} from './networkSyncing';

describe('useDeleteNetworkSyncingDataFromUserStorage()', () => {
  it('should dispatch account sync data deletion', async () => {
    const mockDeleteAccountSyncAction = jest.spyOn(
      actions,
      'deleteNetworkSyncingDataFromUserStorage',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDeleteNetworkSyncingDataFromUserStorage(),
      {},
    );

    await result.current.dispatchDeleteNetworkData();
    expect(mockDeleteAccountSyncAction).toHaveBeenCalled();
  });
});

describe('useSyncAccounts', () => {
  const arrangeMocks = () => {
    const mockSyncAccountsAction = jest.spyOn(actions, 'syncNetworks');

    return {
      mockSyncAccountsAction,
    };
  };

  it('should dispatch sync accounts when called', async () => {
    const mocks = arrangeMocks();
    const hook = renderHookWithProviderTyped(() => useSyncNetworks(), {});
    await hook.result.current();
    expect(mocks.mockSyncAccountsAction).toHaveBeenCalled();
  });
});
