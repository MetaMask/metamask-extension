import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import * as useBackupAndSyncHook from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import { MetamaskIdentityProvider } from '../../../../contexts/identity';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  BackupAndSyncFeaturesToggles,
  backupAndSyncFeaturesTogglesTestIds,
} from './backup-and-sync-features-toggles';

const mockStore = configureMockStore();
const initialStore = () => ({
  metamask: {
    isSignedIn: false,
    useExternalServices: true,
    isBackupAndSyncEnabled: true,
    isAccountSyncingEnabled: false,
    isContactSyncingEnabled: false,
    participateInMetaMetrics: false,
    isBackupAndSyncUpdateLoading: false,
    keyrings: [],
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

  it('tracks the toggle event', () => {
    const mockTrackEvent = jest.fn();
    const store = initialStore();

    store.metamask.isAccountSyncingEnabled = true;
    arrangeMocks();

    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockTrackEvent}>
        <BackupAndSyncFeaturesToggles />
      </MetaMetricsContext.Provider>,
      mockStore(store),
    );
    fireEvent.click(
      getByTestId(
        backupAndSyncFeaturesTogglesTestIds.accountSyncingToggleButton,
      ),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: 'Settings',
      event: 'Settings Updated',
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_group: 'backup_and_sync',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_type: 'accounts',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        old_value: true,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_value: false,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        was_notifications_on: undefined,
      },
    });
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

  it('enables contact syncing', () => {
    const store = initialStore();
    store.metamask.isContactSyncingEnabled = false;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncFeaturesToggles />
      </Redux.Provider>,
    );
    fireEvent.click(
      getByTestId(
        backupAndSyncFeaturesTogglesTestIds.contactSyncingToggleButton,
      ),
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      true,
    );
  });

  it('disables contact syncing', () => {
    const store = initialStore();
    store.metamask.isContactSyncingEnabled = true;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncFeaturesToggles />
      </Redux.Provider>,
    );
    fireEvent.click(
      getByTestId(
        backupAndSyncFeaturesTogglesTestIds.contactSyncingToggleButton,
      ),
    );
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.contactSyncing,
      false,
    );
  });

  it('disables main backup and sync when all sub-features are manually turned off', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = true;
    store.metamask.isAccountSyncingEnabled = false; // Already off
    store.metamask.isContactSyncingEnabled = false; // Already off

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncFeaturesToggles />
      </Redux.Provider>,
    );

    // Wait for the reverse cascade effect to fire
    await waitFor(() => {
      expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
        BACKUPANDSYNC_FEATURES.main,
        false,
      );
    });
  });

  it('does not disable main backup and sync when at least one sub-feature is enabled', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = true;
    store.metamask.isAccountSyncingEnabled = true; // One is ON
    store.metamask.isContactSyncingEnabled = false; // One is OFF

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncFeaturesToggles />
      </Redux.Provider>,
    );

    // Wait a bit to ensure useEffect doesn't fire
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should not have disabled main toggle
    expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.main,
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
