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
});
