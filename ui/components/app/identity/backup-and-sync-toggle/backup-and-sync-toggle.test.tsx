import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { MetamaskIdentityProvider } from '../../../../contexts/identity';
import * as useBackupAndSyncHook from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../../modals/identity';
import { showModal } from '../../../../store/actions';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import {
  BackupAndSyncToggle,
  backupAndSyncToggleTestIds,
} from './backup-and-sync-toggle';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockStore = configureMockStore();
const initialStore = () => ({
  metamask: {
    isSignedIn: false,
    useExternalServices: true,
    isBackupAndSyncEnabled: true,
    participateInMetaMetrics: false,
    isBackupAndSyncUpdateLoading: false,
    keyrings: [],
  },
  appState: {
    externalServicesOnboardingToggleState: true,
  },
});

describe('BackupAndSyncToggle', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetamaskIdentityProvider>
          <BackupAndSyncToggle />
        </MetamaskIdentityProvider>
      </Redux.Provider>,
    );
    expect(
      getByTestId(backupAndSyncToggleTestIds.container),
    ).toBeInTheDocument();
  });

  it('tracks the toggle event', () => {
    const mockTrackEvent = jest.fn();
    const store = initialStore();

    store.metamask.isBackupAndSyncEnabled = true;
    arrangeMocks();

    const { getByTestId } = renderWithProvider(
      <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
        <BackupAndSyncToggle />
      </MetaMetricsContext.Provider>,
      mockStore(store),
    );

    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: 'Settings',
      event: 'Settings Updated',
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_group: 'backup_and_sync',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_type: 'main',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        old_value: true,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_value: false,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        was_notifications_on: false,
      },
    });
  });

  it('enables backup and sync when the toggle is turned on and basic functionality is already on', () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = false;

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );
    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.main,
      true,
    );
  });

  it('opens the confirm modal when the toggle is turned on and basic functionality is off', () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = false;
    store.metamask.useExternalServices = false;
    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <BackupAndSyncToggle />
      </Redux.Provider>,
    );
    fireEvent.click(getByTestId(backupAndSyncToggleTestIds.toggleButton));
    expect(setIsBackupAndSyncFeatureEnabledMock).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      showModal({
        name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
        enableBackupAndSync: expect.any(Function),
      }),
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
