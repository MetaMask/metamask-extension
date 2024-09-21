import React from 'react';
import * as Redux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import * as ProfileSyncingHook from '../../../../hooks/metamask-notifications/useProfileSyncing';
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
        <ProfileSyncToggle />
      </Redux.Provider>,
    );
    expect(getByTestId('profileSyncToggle')).toBeInTheDocument();
  });

  it('calls enableProfileSyncing when toggle is turned on', () => {
    const store = initialStore();
    store.metamask.isProfileSyncingEnabled = false; // We want to test enabling this toggle

    const { enableProfileSyncingMock } = arrangeMocks();

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <ProfileSyncToggle />
      </Redux.Provider>,
    );
    fireEvent.click(getByTestId('toggleButton'));
    expect(enableProfileSyncingMock).toHaveBeenCalled();
  });

  function arrangeMocks() {
    const enableProfileSyncingMock = jest.fn(() => Promise.resolve());
    const disableProfileSyncingMock = jest.fn(() => Promise.resolve());

    jest.spyOn(ProfileSyncingHook, 'useEnableProfileSyncing').mockReturnValue({
      enableProfileSyncing: enableProfileSyncingMock,
      error: null,
    });

    jest.spyOn(ProfileSyncingHook, 'useDisableProfileSyncing').mockReturnValue({
      disableProfileSyncing: disableProfileSyncingMock,
      error: null,
    });

    return {
      enableProfileSyncingMock,
      disableProfileSyncingMock,
    };
  }
});
