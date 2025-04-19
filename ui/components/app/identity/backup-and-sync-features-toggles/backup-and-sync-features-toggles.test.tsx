import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import * as useBackupAndSyncHook from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import { MetamaskIdentityProvider } from '../../../../contexts/identity';
import {
  BackupAndSyncFeaturesToggles,
  backupAndSyncFeaturesTogglesTestIds,
} from './backup-and-sync-features-toggles';

const mockStore = configureMockStore();
const initialStore = () => ({
  metamask: {
    isSignedIn: false,
    useExternalServices: true,
    isProfileSyncingEnabled: true,
    isAccountSyncingEnabled: false,
    participateInMetaMetrics: false,
    isProfileSyncingUpdateLoading: false,
  },
});

describe('BackupAndSyncFeaturesToggles', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetamaskIdentityProvider>
          <BackupAndSyncFeaturesToggles />
        </MetamaskIdentityProvider>
      </Redux.Provider>,
    );
    expect(
      getByTestId(backupAndSyncFeaturesTogglesTestIds.container),
    ).toBeInTheDocument();
  });

  it('enables account syncing', () => {
    const store = initialStore();
    store.metamask.isAccountSyncingEnabled = false;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncFeaturesToggles />
      </Redux.Provider>,
    );
    fireEvent.click(
      getByTestId(
        backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleButton,
      ),
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      true,
    );
  });

  it('disables account syncing', () => {
    const store = initialStore();
    store.metamask.isAccountSyncingEnabled = true;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncFeaturesToggles />
      </Redux.Provider>,
    );
    fireEvent.click(
      getByTestId(
        backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleButton,
      ),
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.accountSyncing,
      false,
    );
  });

  function arrangeMocks() {
    const setIsBackupAndSyncFeatureEnabledMock = jest.fn(() =>
      Promise.resolve(),
    );

    jest.spyOn(useBackupAndSyncHook, 'useBackupAndSync').mockReturnValue({
      setIsBackupAndSyncFeatureEnabled: setIsBackupAndSyncFeatureEnabledMock,
      error: null,
    });

    return {
      setIsBackupAndSyncFeatureEnabledMock,
    };
  }
});
