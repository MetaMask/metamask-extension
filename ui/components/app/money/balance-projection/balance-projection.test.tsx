import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import type { UseMoneyAccountBalanceResult } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../../../hooks/money/useMoneyAnalytics.mock';
import {
  MoneyComponentName,
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../pages/money/constants/money-events';
import { BalanceProjection } from './balance-projection';

jest.mock('../../../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: jest.fn(),
}));

jest.mock('../../../../contexts/route-messenger', () => ({
  RouteMessengerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('../../../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

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

function renderProjection(amountFiat: string) {
  return renderWithProvider(
    <BalanceProjection amountFiat={amountFiat} />,
    configureStore(mockState),
  );
}

describe('BalanceProjection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
  });

  it('renders the projected balance for $1,000 at 4% APY over 1 year', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('1000');

    expect(screen.getByTestId('balance-projection')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyAccountProjectedBalance.message),
    ).toBeInTheDocument();
    expect(screen.getByText('$1,040.00')).toBeInTheDocument();
  });

  it('renders the APY pitch when the amount is "0"', () => {
    mockBalance({ apyDecimal: 0.069, apyPercent: 6.9 });

    renderProjection('0');

    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toHaveTextContent('Earn 6.9% APY');
  });

  it('renders the APY pitch when the amount is empty', () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('');

    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toHaveTextContent('Earn 4% APY');
  });

  it('shows the APY tooltip when the pitch is hovered', async () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('0');

    const trigger = screen.getByTestId(
      'balance-projection-apy-pitch-info-trigger',
    );
    expect(trigger).toHaveTextContent('4% APY');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });

    expect(
      screen.getByText(messages.moneyAccountApyTooltip.message),
    ).toBeInTheDocument();
  });

  it('tracks the APY tooltip when the pitch APY text is hovered', async () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('0');
    await act(async () => {
      fireEvent.mouseEnter(
        screen.getByTestId('balance-projection-apy-pitch-info-trigger'),
      );
    });

    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      screenName: MoneyScreenName.MoneyDeposit,
    });
    expect(mockMoneyAnalytics.trackTooltipClicked).toHaveBeenCalledWith({
      tooltipName: MoneyTooltipName.Apy,
      tooltipType: MoneyTooltipType.Info,
    });
  });

  it('tracks the earn-on-crypto tooltip when the projected balance is hovered', async () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('1000');
    await act(async () => {
      fireEvent.mouseEnter(
        screen.getByTestId('balance-projection-info-trigger'),
      );
    });

    expect(mockMoneyAnalytics.trackTooltipClicked).toHaveBeenCalledWith({
      tooltipName: MoneyTooltipName.EarnOnYourCrypto,
      tooltipType: MoneyTooltipType.Info,
      componentName: MoneyComponentName.BalanceProjection,
    });
  });

  it('shows the projection tooltip when the projected balance is hovered', async () => {
    mockBalance({ apyDecimal: 0.04, apyPercent: 4 });

    renderProjection('1000');

    const trigger = screen.getByTestId('balance-projection-info-trigger');
    expect(trigger).toHaveTextContent('$1,040.00');

    await act(async () => {
      fireEvent.mouseEnter(trigger);
    });

    expect(
      screen.getByText(
        messages.moneyAccountProjectedBalanceTooltip.message.replace('$1', '4'),
      ),
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

  it('keeps the APY pitch visible while the live query loads if fallback APY is already available', () => {
    mockBalance({
      apyDecimal: 0.04,
      apyPercent: 4,
      isLoading: true,
    });

    renderProjection('0');

    expect(
      screen.getByTestId('balance-projection-apy-pitch'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('balance-projection-skeleton'),
    ).not.toBeInTheDocument();
  });

  it('keeps the projected balance visible while the live query loads if fallback APY is already available', () => {
    mockBalance({
      apyDecimal: 0.04,
      apyPercent: 4,
      isLoading: true,
    });

    renderProjection('1000');

    expect(screen.getByTestId('balance-projection')).toBeInTheDocument();
    expect(screen.getByText('$1,040.00')).toBeInTheDocument();
    expect(
      screen.queryByTestId('balance-projection-skeleton'),
    ).not.toBeInTheDocument();
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
