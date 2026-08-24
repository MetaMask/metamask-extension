import React from 'react';
import { screen } from '@testing-library/react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { useMoneyAccountBalance } from '../../../../../hooks/money/useMoneyAccountBalance';
import type { UseMoneyAccountBalanceResult } from '../../../../../hooks/money/useMoneyAccountBalance';
import { BalanceProjection } from './balance-projection';

jest.mock('../../../../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: jest.fn(),
}));

jest.mock('../../../../../contexts/route-messenger', () => ({
  RouteMessengerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const useMoneyAccountBalanceMock = jest.mocked(useMoneyAccountBalance);

function mockBalance({
  apyDecimal,
  apyPercent,
  isLoading = false,
}: {
  apyDecimal: number | undefined;
  apyPercent: number | undefined;
  isLoading?: boolean;
}) {
  useMoneyAccountBalanceMock.mockReturnValue({
    apyDecimal,
    apyPercent,
    vaultApyQuery: { isLoading },
  } as UseMoneyAccountBalanceResult);
}

function renderProjection(amountFiat: string, projectedYears = 1) {
  return renderWithProvider(
    <BalanceProjection
      amountFiat={amountFiat}
      projectedYears={projectedYears}
    />,
    configureStore(mockState),
  );
}

describe('BalanceProjection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders the projected balance for $1,000 at 4% APY over 1 year', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('1000');

    expect(screen.getByTestId('balance-projection')).toBeInTheDocument();
    expect(screen.getByText('Projected 1-year balance:')).toBeInTheDocument();
    expect(screen.getByText('$1,040.00')).toBeInTheDocument();
  });

  it('compounds the projection over multiple years', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('1000', 5);

    expect(screen.getByText('$1,216.65')).toBeInTheDocument();
  });

  it('renders the APY pitch when the amount is "0"', () => {
    mockBalance({ apyDecimal: 0.069, apyPercent: 6.9 });

    renderProjection('0');

    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toBeInTheDocument();
    expect(screen.getByText('Earn 6.9% APY')).toBeInTheDocument();
  });

  it('renders the APY pitch when the amount is empty', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('');

    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toBeInTheDocument();
    expect(screen.getByText('Earn 4% APY')).toBeInTheDocument();
  });

  it('renders the info button on the APY pitch', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('0');

    expect(
      screen.getByTestId('balance-projection-apy-pitch-info-button'),
    ).toBeInTheDocument();
  });

  it('renders the info button next to the projected balance', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('1000');

    expect(
      screen.getByTestId('balance-projection-info-button'),
    ).toBeInTheDocument();
  });

  it('reserves space with a skeleton while APY is loading', () => {
    mockBalance({
      apyDecimal: undefined,
      apyPercent: undefined,
      isLoading: true,
    });

    renderProjection('1000');

    expect(screen.queryByTestId('balance-projection')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('balance-projection-apy-pitch'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('balance-projection-skeleton'),
    ).toBeInTheDocument();
  });

  it('returns nothing when APY is unavailable', () => {
    mockBalance({ apyDecimal: undefined, apyPercent: undefined });

    renderProjection('1000');

    expect(screen.queryByTestId('balance-projection')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('balance-projection-apy-pitch'),
    ).not.toBeInTheDocument();
  });

  it('returns nothing when APY is negative', () => {
    mockBalance({ apyDecimal: -1, apyPercent: -100 });

    renderProjection('1000');

    expect(screen.queryByTestId('balance-projection')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('balance-projection-apy-pitch'),
    ).not.toBeInTheDocument();
  });

  it('returns nothing when the amount is non-numeric', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('abc');

    expect(screen.queryByTestId('balance-projection')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('balance-projection-apy-pitch'),
    ).not.toBeInTheDocument();
  });

  it('projects $1 at 6.9% APY to $1.07 over one year', () => {
    mockBalance({ apyDecimal: 0.069, apyPercent: 6.9 });

    renderProjection('1');

    expect(screen.getByText('$1.07')).toBeInTheDocument();
  });

  it('projects a full-precision APY with more than 15 significant digits', () => {
    mockBalance({ apyDecimal: 0.06894619904358379, apyPercent: 6.9 });

    renderProjection('1');

    expect(screen.getByTestId('balance-projection')).toBeInTheDocument();
    expect(screen.getByText('$1.07')).toBeInTheDocument();
  });
});
