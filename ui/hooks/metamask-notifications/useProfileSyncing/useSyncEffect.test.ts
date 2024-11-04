import { waitFor } from '@testing-library/dom';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as SyncAccountsModule from './accountSyncing';
import * as SyncNetworksModule from './networkSyncing';
import * as ProfileSyncModule from './profileSyncing';
import { useSyncEffect } from './useSyncEffect';

describe('useSyncEffect()', () => {
  const arrangeMocks = () => {
    const mockUseShouldProfileSync = jest.spyOn(
      ProfileSyncModule,
      'useShouldDispatchProfileSyncing',
    );

    const mockSyncAccountsCallback = jest.fn();
    const mockSyncAccounts = jest
      .spyOn(SyncAccountsModule, 'useSyncAccounts')
      .mockReturnValue(mockSyncAccountsCallback);

    const mockSyncNetworksCallback = jest.fn();
    const mockSyncNetworks = jest
      .spyOn(SyncNetworksModule, 'useSyncNetworks')
      .mockReturnValue(mockSyncNetworksCallback);

    return {
      mockUseShouldProfileSync,
      mockSyncAccounts,
      mockSyncNetworks,
      mockSyncAccountsCallback,
      mockSyncNetworksCallback,
    };
  };

  const arrangeAndAct = (props: { profileSyncConditionsMet: boolean }) => {
    // Arrange
    const mocks = arrangeMocks();
    mocks.mockUseShouldProfileSync.mockReturnValue(
      props.profileSyncConditionsMet,
    );

    // Act
    renderHookWithProviderTyped(() => useSyncEffect(), {});
    return mocks;
  };

  it('should run effect if profile sync conditions are met', async () => {
    const mocks = arrangeAndAct({ profileSyncConditionsMet: true });
    await waitFor(() => {
      expect(mocks.mockSyncAccountsCallback).toHaveBeenCalled();
      expect(mocks.mockSyncNetworksCallback).toHaveBeenCalled();
    });
  });

  it('should not run effect if profile sync conditions are not met', async () => {
    const mocks = arrangeAndAct({ profileSyncConditionsMet: false });
    await waitFor(() => {
      expect(mocks.mockSyncAccountsCallback).not.toHaveBeenCalled();
      expect(mocks.mockSyncNetworksCallback).not.toHaveBeenCalled();
    });
  });
});
