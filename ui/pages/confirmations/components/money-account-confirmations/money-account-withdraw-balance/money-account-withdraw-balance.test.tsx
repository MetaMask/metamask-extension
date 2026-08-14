import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useMoneyAccountBalance } from '../../../../../hooks/money/useMoneyAccountBalance';
import type { UseMoneyAccountBalanceResult } from '../../../../../hooks/money/useMoneyAccountBalance';
import { MoneyAccountWithdrawBalance } from './money-account-withdraw-balance';

jest.mock('../../../../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: jest.fn(),
}));

const useMoneyAccountBalanceMock = jest.mocked(useMoneyAccountBalance);

function renderBalance() {
  return renderWithProvider(
    <MoneyAccountWithdrawBalance />,
    configureStore(mockState),
  );
}

describe('MoneyAccountWithdrawBalance', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the formatted withdrawable balance', () => {
    useMoneyAccountBalanceMock.mockReturnValue({
      withdrawableFiatFormatted: '$7.06',
    } as UseMoneyAccountBalanceResult);

    renderBalance();

    expect(
      screen.getByTestId('money-account-withdraw-balance'),
    ).toHaveTextContent('Available balance: $7.06');
  });

  it('renders nothing when the withdrawable balance is unknown', () => {
    useMoneyAccountBalanceMock.mockReturnValue({
      withdrawableFiatFormatted: undefined,
    } as UseMoneyAccountBalanceResult);

    renderBalance();

    expect(
      screen.queryByTestId('money-account-withdraw-balance'),
    ).not.toBeInTheDocument();
  });
});
