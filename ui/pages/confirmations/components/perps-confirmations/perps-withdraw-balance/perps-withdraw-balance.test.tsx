import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { PerpsWithdrawBalance } from './perps-withdraw-balance';

const renderWithPrivacyMode = (privacyMode: boolean) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      preferences: {
        ...mockState.metamask.preferences,
        privacyMode,
      },
    },
  });
  return renderWithProvider(<PerpsWithdrawBalance />, store);
};

jest.mock('../../../../../hooks/perps/stream', () => ({
  usePerpsLiveAccount: jest.fn(),
}));

const usePerpsLiveAccountMock = jest.mocked(usePerpsLiveAccount);

function renderBalance() {
  const store = configureStore(mockState);
  return renderWithProvider(<PerpsWithdrawBalance />, store);
}

describe('PerpsWithdrawBalance', () => {
  beforeEach(() => {
    usePerpsLiveAccountMock.mockReset();
  });

  it('renders the formatted Perps available balance', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: { spendableBalance: '1232.39' } as never,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByText(messages.perpsAvailableBalance.message.trim()),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('perps-withdraw-balance-value'),
    ).toHaveTextContent('$1,232.39');
  });

  it('prefers available-to-trade balance when provided', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: {
        spendableBalance: '0',
        withdrawableBalance: '456.78',
      } as never,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByTestId('perps-withdraw-balance-value'),
    ).toHaveTextContent('$456.78');
  });

  it('renders $0.00 when the live account has no balance', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: null,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByTestId('perps-withdraw-balance-value'),
    ).toHaveTextContent('$0.00');
  });

  it('masks the balance when privacy mode is enabled', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: { spendableBalance: '1232.39' } as never,
      isInitialLoading: false,
    });

    renderWithPrivacyMode(true);

    expect(
      screen.getByTestId('perps-withdraw-balance-value'),
    ).toHaveTextContent('••••••');
  });
});
