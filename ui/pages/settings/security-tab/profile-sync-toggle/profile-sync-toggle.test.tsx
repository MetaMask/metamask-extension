import React from 'react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { render, fireEvent } from '@testing-library/react';
import * as ProfileSyncingHook from '../../../../hooks/metamask-notifications/useProfileSyncing';
import ProfileSyncToggle from './profile-sync-toggle';

let mockUseSelectorReturnValue = false;

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(() => mockUseSelectorReturnValue),
}));

const mockStore = configureMockStore();
const initialState = {
  metamask: {
    isSignedIn: false,
  },
};
const store = mockStore(initialState);

describe('ProfileSyncToggle', () => {
  const enableProfileSyncingMock = jest.fn(() => Promise.resolve());
  const showConfirmTurnOffProfileSyncingMock = jest.fn();

  beforeEach(() => {
    jest.spyOn(ProfileSyncingHook, 'useEnableProfileSyncing').mockReturnValue({
      enableProfileSyncing: enableProfileSyncingMock,
      loading: false,
      error: null,
    });
    jest
      .spyOn(store, 'dispatch')
      .mockImplementation(showConfirmTurnOffProfileSyncingMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    mockUseSelectorReturnValue = false;
    const { getByTestId } = render(
      <Provider store={store}>
        <ProfileSyncToggle />
      </Provider>,
    );
    expect(getByTestId('profileSyncToggle')).toBeInTheDocument();
  });

  it('calls enableProfileSyncing when toggle is turned on', () => {
    mockUseSelectorReturnValue = false;
    const { getByTestId } = render(
      <Provider store={store}>
        <ProfileSyncToggle />
      </Provider>,
    );
    fireEvent.click(getByTestId('toggleButton'));
    expect(enableProfileSyncingMock).toHaveBeenCalled();
  });

  it('dispatches showConfirmTurnOffProfileSyncing when toggle is turned off', () => {
    mockUseSelectorReturnValue = true;
    const { getByTestId } = render(
      <Provider store={store}>
        <ProfileSyncToggle />
      </Provider>,
    );
    fireEvent.click(getByTestId('toggleButton'));
    expect(showConfirmTurnOffProfileSyncingMock).toHaveBeenCalled();
  });
});
