import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { HideZeroBalanceTokensToggleItem } from './hide-zero-balance-tokens-item';

const mockSetHideZeroBalanceTokens = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setHideZeroBalanceTokens: (val: boolean) => {
    mockSetHideZeroBalanceTokens(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('HideZeroBalanceTokensToggleItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<HideZeroBalanceTokensToggleItem />, mockStore);

    expect(
      screen.getByText(messages.hideZeroBalanceTokens.message),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          hideZeroBalanceTokens: true,
        },
      },
    });
    renderWithProvider(<HideZeroBalanceTokensToggleItem />, storeEnabled);

    expect(screen.getByTestId('toggle-zero-balance-button')).toHaveAttribute(
      'value',
      'true',
    );
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          hideZeroBalanceTokens: false,
        },
      },
    });
    renderWithProvider(<HideZeroBalanceTokensToggleItem />, storeDisabled);

    expect(screen.getByTestId('toggle-zero-balance-button')).toHaveAttribute(
      'value',
      'false',
    );
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          hideZeroBalanceTokens: true,
        },
      },
    });
    renderWithProvider(<HideZeroBalanceTokensToggleItem />, storeEnabled);

    fireEvent.click(screen.getByTestId('toggle-zero-balance-button'));

    expect(mockSetHideZeroBalanceTokens).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          hideZeroBalanceTokens: false,
        },
      },
    });
    renderWithProvider(<HideZeroBalanceTokensToggleItem />, storeDisabled);

    fireEvent.click(screen.getByTestId('toggle-zero-balance-button'));

    expect(mockSetHideZeroBalanceTokens).toHaveBeenCalledWith(true);
  });
});
