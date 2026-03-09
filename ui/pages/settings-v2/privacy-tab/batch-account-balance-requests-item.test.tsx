import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { BatchAccountBalanceRequestsToggleItem } from './batch-account-balance-requests-item';

const mockSetUseMultiAccountBalanceChecker = jest.fn();

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setUseMultiAccountBalanceChecker: (val: boolean) => {
    mockSetUseMultiAccountBalanceChecker(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('BatchAccountBalanceRequestsToggleItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<BatchAccountBalanceRequestsToggleItem />, mockStore);

    expect(
      screen.getByText(messages.useMultiAccountBalanceChecker.message),
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    const mockStore = configureMockStore([thunk])(mockState);
    renderWithProvider(<BatchAccountBalanceRequestsToggleItem />, mockStore);

    expect(
      screen.getByText(
        messages.useMultiAccountBalanceCheckerSettingDescriptionV2.message,
      ),
    ).toBeInTheDocument();
  });

  it('renders toggle in enabled state', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useMultiAccountBalanceChecker: true,
      },
    });
    renderWithProvider(<BatchAccountBalanceRequestsToggleItem />, storeEnabled);

    expect(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    ).toHaveAttribute('value', 'true');
  });

  it('renders toggle in disabled state', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useMultiAccountBalanceChecker: false,
      },
    });
    renderWithProvider(
      <BatchAccountBalanceRequestsToggleItem />,
      storeDisabled,
    );

    expect(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    ).toHaveAttribute('value', 'false');
  });

  it('calls action with false when toggled off', () => {
    const storeEnabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useMultiAccountBalanceChecker: true,
      },
    });
    renderWithProvider(<BatchAccountBalanceRequestsToggleItem />, storeEnabled);

    fireEvent.click(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    );

    expect(mockSetUseMultiAccountBalanceChecker).toHaveBeenCalledWith(false);
  });

  it('calls action with true when toggled on', () => {
    const storeDisabled = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        useMultiAccountBalanceChecker: false,
      },
    });
    renderWithProvider(
      <BatchAccountBalanceRequestsToggleItem />,
      storeDisabled,
    );

    fireEvent.click(
      screen.getByTestId('batch-account-balance-requests-toggle'),
    );

    expect(mockSetUseMultiAccountBalanceChecker).toHaveBeenCalledWith(true);
  });
});
