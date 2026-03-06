import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { ShowNetworkTokenToggleItem } from './show-network-token-item';

const mockSetShowNativeTokenAsMainBalancePreference = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setShowNativeTokenAsMainBalancePreference: (val: boolean) => {
    mockSetShowNativeTokenAsMainBalancePreference(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ShowNetworkTokenToggleItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<ShowNetworkTokenToggleItem />, mockStore);

    expect(
      screen.getByText(messages.showNativeTokenAsMainBalance.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showNativeTokenAsMainBalance: true,
        },
      },
    });
    renderWithProvider(<ShowNetworkTokenToggleItem />, storeEnabled);

    expect(
      screen.getByTestId('show-native-token-as-main-balance'),
    ).toHaveAttribute('value', 'true');
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showNativeTokenAsMainBalance: false,
        },
      },
    });
    renderWithProvider(<ShowNetworkTokenToggleItem />, storeDisabled);

    expect(
      screen.getByTestId('show-native-token-as-main-balance'),
    ).toHaveAttribute('value', 'false');
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showNativeTokenAsMainBalance: true,
        },
      },
    });
    renderWithProvider(<ShowNetworkTokenToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('show-native-token-as-main-balance'));

    expect(mockSetShowNativeTokenAsMainBalancePreference).toHaveBeenCalledWith(
      false,
    );
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          showNativeTokenAsMainBalance: false,
        },
      },
    });
    renderWithProvider(<ShowNetworkTokenToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('show-native-token-as-main-balance'));

    expect(mockSetShowNativeTokenAsMainBalancePreference).toHaveBeenCalledWith(
      true,
    );
  });
});
