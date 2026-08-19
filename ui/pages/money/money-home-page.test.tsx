import React from 'react';
import { screen, within } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { MoneyHomePage } from './money-home-page';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyAccountBalance = jest.fn();
const mockUseMultiChainAssets = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
}));
jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));
jest.mock('../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: () => mockUseMoneyAccountBalance(),
}));
jest.mock('../../components/app/assets/hooks/useMultichainAssets', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => mockUseMultiChainAssets(),
}));

describe('MoneyHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
      isLoading: false,
    });
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber(0),
      totalFiatFormatted: '$0.00',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMultiChainAssets.mockReturnValue([]);
  });

  it('renders the full empty-state composition with a live zero balance', () => {
    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-home-page')).toBeInTheDocument();
    expect(screen.getByTestId('money-balance')).toHaveTextContent('$0.00');
    expect(screen.getByText('Earn up to 4.2% APY')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowItWorks.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-how-it-works-description'),
    ).toHaveTextContent(
      messages.moneyHowItWorksDescriptionWithApy.message.replace(
        '$1',
        '4.2% APY',
      ),
    );
    expect(
      within(screen.getByTestId('money-how-it-works-description')).getByText(
        '4.2% APY',
      ),
    ).toHaveClass('text-success-default');
    expect(
      screen.queryByTestId('money-eligible-assets'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyBenefits.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Auto-earn up to ~4.2% APY')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyBenefitStablecoin.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyBenefitLiquidity.message),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: messages.moneyLearnMore.message }),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText('Auto-earn up to ~4.2% APY')
        .closest('li')
        ?.querySelector('svg'),
    ).toHaveClass('shrink-0');
    expect(
      screen.getByTestId('money-activity-placeholder'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId('money-activity-placeholder-row'),
    ).toHaveLength(3);
  });

  it('keeps all groundwork actions inert', () => {
    renderWithLocalization(<MoneyHomePage />);

    screen.getAllByRole('button').forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('renders the filled-state composition for a funded Money account', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('3475.45'),
      totalFiatFormatted: '$3,475.45',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMultiChainAssets.mockReturnValue([
      {
        address: '0x1',
        chainId: '0x1',
        image: 'usdc.png',
        secondary: '$12.00',
        symbol: 'USDC',
        tokenFiatAmount: 12,
      },
    ]);

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-balance')).toHaveTextContent('$3,475.45');
    expect(
      screen.getByTestId('money-position-placeholder'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnings.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-position-monthly-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-position-lifetime-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-activity-placeholder'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-condensed-info-cards'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyHowYourMoneyGrows.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyMeetMusd.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyExploreBenefits.message),
    ).toBeInTheDocument();
    ['growth', 'musd', 'benefits'].forEach((card) => {
      expect(
        screen.getByTestId(`money-condensed-info-card-${card}-image`),
      ).toHaveClass('rounded-xl', 'bg-background-subsection');
    });
    expect(screen.queryByText('Earn up to 4.2% APY')).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.moneyHowItWorks.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.moneyBenefits.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('money-eligible-assets'),
    ).not.toBeInTheDocument();
    screen.getAllByRole('button').forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('keeps a balance below the funded threshold in the empty state', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('0.009'),
      totalFiatFormatted: '$0.01',
      vaultApyQuery: { isLoading: false },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.getByText(messages.moneyHowItWorks.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('money-position-placeholder'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('money-condensed-info-cards'),
    ).not.toBeInTheDocument();
  });

  it('renders a loading composition while availability is resolving', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-home-loading')).toBeInTheDocument();
  });

  it('keeps state-specific content hidden while the balance is loading', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: true,
      tokenTotal: undefined,
      totalFiatFormatted: undefined,
      vaultApyQuery: { isLoading: false },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-home-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('money-home-page')).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.moneyHowItWorks.message),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('money-position-placeholder'),
    ).not.toBeInTheDocument();
  });

  it('redirects unavailable users to Home', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: false,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
  });

  it('does not fabricate a balance when the balance service fails', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: true,
      isBalanceLoading: false,
      tokenTotal: undefined,
      totalFiatFormatted: undefined,
      vaultApyQuery: { isLoading: false },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-balance')).toHaveTextContent(
      'Balance unavailable',
    );
  });

  it('shows a configured APY override while the service query is loading', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyPercentFormatted: '5%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber(0),
      totalFiatFormatted: '$0.00',
      vaultApyQuery: { isLoading: true },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      within(screen.getByTestId('money-how-it-works-description')).getByText(
        '5% APY',
      ),
    ).toBeInTheDocument();
  });

  it('previews eligible wallet assets using their existing balances', () => {
    mockUseMultiChainAssets.mockReturnValue([
      {
        address: '0x1',
        chainId: '0x1',
        image: 'usdc.png',
        secondary: '$12.00',
        symbol: 'USDC',
        tokenFiatAmount: 12,
      },
      {
        address: '0x2',
        chainId: '0x1',
        image: 'other.png',
        secondary: '$100.00',
        symbol: 'OTHER',
        tokenFiatAmount: 100,
      },
    ]);

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-eligible-assets')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
    expect(screen.queryByText('OTHER')).not.toBeInTheDocument();
  });
});
