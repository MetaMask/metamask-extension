import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../test/lib/i18n-helpers';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { PerpsWithdrawBalance } from './perps-withdraw-balance';

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
      account: { availableBalance: '1232.39' } as never,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByText(
        new RegExp(
          `${messages.perpsAvailableBalance.message}\\$1,232\\.39`,
          'u',
        ),
      ),
    ).toBeInTheDocument();
  });

  it('prefers available-to-trade balance when provided', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: {
        availableBalance: '0',
        availableToTradeBalance: '456.78',
      } as never,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByText(
        new RegExp(`${messages.perpsAvailableBalance.message}\\$456\\.78`, 'u'),
      ),
    ).toBeInTheDocument();
  });

  it('renders $0.00 when the live account has no balance', () => {
    usePerpsLiveAccountMock.mockReturnValue({
      account: null,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByText(
        new RegExp(`${messages.perpsAvailableBalance.message}\\$0\\.00`, 'u'),
      ),
    ).toBeInTheDocument();
  });

  it('prefers `availableToTradeBalance` over `availableBalance` for HyperLiquid Unified Account mode', () => {
    // Unified mode reports `availableBalance: $0` because USDC sits in the
    // spot clearinghouse. The unified `availableToTradeBalance` field is the
    // correct withdrawable amount. Mirrors metamask-mobile#29492.
    usePerpsLiveAccountMock.mockReturnValue({
      account: {
        availableBalance: '0',
        availableToTradeBalance: '41.13',
      } as never,
      isInitialLoading: false,
    });

    renderBalance();

    expect(
      screen.getByText(
        new RegExp(`${messages.perpsAvailableBalance.message}\\$41\\.13`, 'u'),
      ),
    ).toBeInTheDocument();
  });
});
