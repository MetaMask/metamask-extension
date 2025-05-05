import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { MetamaskIdentityProvider } from '../../../../contexts/identity';
import * as useBackupAndSyncHook from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../../modals/identity';
import { showModal } from '../../../../store/actions';
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
    isProfileSyncingEnabled: true,
    participateInMetaMetrics: false,
    isProfileSyncingUpdateLoading: false,
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

  // Logic to disable backup and sync is not tested here because it happens in confirm-turn-off-profile-syncing.test.tsx
  it('enables backup and sync when the toggle is turned on and basic functionality is already on', () => {
    const store = initialStore();
    store.metamask.isProfileSyncingEnabled = false;

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
    store.metamask.isProfileSyncingEnabled = false;
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
