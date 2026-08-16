import React from 'react';
import { screen, within } from '@testing-library/react';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { MoneyHomePage } from './money-home-page';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyAccountBalance = jest.fn();
const mockUseMoneyVaultApy = jest.fn();
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
jest.mock('../../hooks/money/use-money-account-balance', () => ({
  useMoneyAccountBalance: () => mockUseMoneyAccountBalance(),
}));
jest.mock('../../hooks/money/use-money-vault-apy', () => ({
  useMoneyVaultApy: () => mockUseMoneyVaultApy(),
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
      query: { isLoading: false, isError: false },
      formattedBalance: '$0.00',
    });
    mockUseMoneyVaultApy.mockReturnValue({
      query: { isLoading: false },
      formattedApy: '4.2%',
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
      'Add mUSD and earn up to 4.2% APY. Your balance is dollar-backed and ready to spend, trade, or send anytime.',
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

  it('renders a loading composition while availability is resolving', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-home-loading')).toBeInTheDocument();
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
      query: { isLoading: false, isError: true },
      formattedBalance: undefined,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-balance')).toHaveTextContent(
      'Balance unavailable',
    );
  });

  it('shows a configured APY override while the service query is loading', () => {
    mockUseMoneyVaultApy.mockReturnValue({
      query: { isLoading: true },
      formattedApy: '5%',
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
