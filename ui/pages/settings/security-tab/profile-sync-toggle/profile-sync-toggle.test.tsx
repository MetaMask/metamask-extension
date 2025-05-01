import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import { MetamaskNotificationsProvider } from '../../../../contexts/metamask-notifications';
import * as ProfileSyncingHook from '../../../../hooks/identity/useBackupAndSync/useBackupAndSync';
import ProfileSyncToggle from './profile-sync-toggle';

const mockStore = configureMockStore();
const initialStore = () => ({
  metamask: {
    isSignedIn: false,
    useExternalServices: true,
    isProfileSyncingEnabled: true,
    participateInMetaMetrics: false,
    isProfileSyncingUpdateLoading: false,
  },
});

describe('ProfileSyncToggle', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetamaskNotificationsProvider>
          <ProfileSyncToggle />
        </MetamaskNotificationsProvider>
      </Redux.Provider>,
    );
    expect(getByTestId('profileSyncToggle')).toBeInTheDocument();
  });

  // Logic to disable backup and sync is not tested here because it happens in confirm-turn-off-profile-syncing.test.tsx
  it('calls enableProfileSyncing when toggle is turned on', () => {
    const store = initialStore();
    store.metamask.isProfileSyncingEnabled = false; // We want to test enabling this toggle

    const { setIsBackupAndSyncFeatureEnabledMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <ProfileSyncToggle />
      </Redux.Provider>,
    );
    fireEvent.click(getByTestId('toggleButton'));
    expect(setIsBackupAndSyncFeatureEnabledMock).toHaveBeenCalled();
  });

  function arrangeMocks() {
    const setIsBackupAndSyncFeatureEnabledMock = jest.fn(() =>
      Promise.resolve(),
    );

    jest.spyOn(ProfileSyncingHook, 'useBackupAndSync').mockReturnValue({
      setIsBackupAndSyncFeatureEnabled: setIsBackupAndSyncFeatureEnabledMock,
      error: null,
    });

    return {
      setIsBackupAndSyncFeatureEnabledMock,
    };
  }
});
