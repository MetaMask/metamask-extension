import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { BigNumber } from 'bignumber.js';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { MONEY_ACTIVITY_ROUTE } from '../../helpers/constants/routes';
import { selectMoneyEarningSectionEnabled } from '../../selectors/money/money-account-feature-flags';
import { getPrivacyMode } from '../../selectors/selectors';
import { MoneyHomePage } from './money-home-page';
import MOCK_MONEY_TRANSACTIONS from './constants/mock-activity-data';
import { onchainItem } from './types/money-activity';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyAccountBalance = jest.fn();
const mockUseMoneyAccountInterest = jest.fn();
const mockUseMoneyDepositTokens = jest.fn();
const mockUseMoneyActivityItems = jest.fn();
const mockUseMoneyActivityItemClick = jest.fn();
const mockUseMoneyAccountDeposit = jest.fn();
const mockInitiateDeposit = jest.fn();
const mockNavigate = jest.fn();
const mockSelectMoneyEarningSectionEnabled = jest.mocked(
  selectMoneyEarningSectionEnabled,
);
const mockGetPrivacyMode = jest.mocked(getPrivacyMode);

const interestResponse = (value: string) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interest_earned_usd: value,
});

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/money/money-account-feature-flags', () => ({
  ...jest.requireActual('../../selectors/money/money-account-feature-flags'),
  selectMoneyEarningSectionEnabled: jest.fn(),
}));
jest.mock('../../selectors/selectors', () => ({
  ...jest.requireActual('../../selectors/selectors'),
  getPrivacyMode: jest.fn(),
}));
jest.mock('../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyWithMinThreshold: (value: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value),
  }),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
  useNavigate: () => mockNavigate,
}));
jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));
jest.mock('../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: () => mockUseMoneyAccountBalance(),
}));
jest.mock('../../hooks/money/useMoneyAccountInterest', () => ({
  useMoneyAccountInterest: (options: unknown) =>
    mockUseMoneyAccountInterest(options),
}));
jest.mock('../../hooks/money/use-money-deposit-tokens', () => ({
  useMoneyDepositTokens: () => mockUseMoneyDepositTokens(),
}));
jest.mock('../../hooks/money/use-money-activity-items', () => ({
  useMoneyActivityItems: () => mockUseMoneyActivityItems(),
}));
jest.mock('../../hooks/money/useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: () => mockUseMoneyAccountDeposit(),
}));

jest.mock('../../hooks/money/use-money-activity-item-click', () => ({
  useMoneyActivityItemClick: () => mockUseMoneyActivityItemClick(),
}));

describe('MoneyHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectMoneyEarningSectionEnabled.mockReturnValue(true);
    mockGetPrivacyMode.mockReturnValue(false);
    mockUseMoneyActivityItemClick.mockReturnValue(undefined);
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
      isLoading: false,
    });
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber(0),
      totalFiatFormatted: '$0.00',
      totalFiatRaw: '0',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyAccountInterest.mockReturnValue({
      last30DaysQuery: {
        data: interestResponse('12.34'),
        isLoading: false,
      },
      sinceInceptionQuery: {
        data: interestResponse('56.78'),
        isLoading: false,
      },
    });
    mockUseMoneyDepositTokens.mockReturnValue({
      tokens: [],
      isNoFeeToken: () => false,
    });
    mockUseMoneyActivityItems.mockReturnValue({ items: [] });
    mockInitiateDeposit.mockResolvedValue(undefined);
    mockUseMoneyAccountDeposit.mockReturnValue({
      initiateDeposit: mockInitiateDeposit,
      isLoading: false,
    });
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
    expect(screen.getByTestId('money-potential-earnings')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnOnCrypto.message),
    ).toBeInTheDocument();
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
    expect(screen.getByTestId('money-activity-list')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyActivityPlaceholderDescription.message),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(/money-activity-row-/u),
    ).not.toBeInTheDocument();
  });

  it('keeps groundwork actions other than the deposit entry points inert', () => {
    renderWithLocalization(<MoneyHomePage />);

    const depositLabels = [
      messages.moneyAdd.message,
      messages.addFunds.message,
    ];
    screen.getAllByRole('button').forEach((button) => {
      if (depositLabels.includes(button.textContent ?? '')) {
        expect(button).toBeEnabled();
      } else {
        expect(button).toBeDisabled();
      }
    });
  });

  it('initiates a deposit from the Add action card', () => {
    renderWithLocalization(<MoneyHomePage />);

    fireEvent.click(
      screen.getByRole('button', { name: messages.moneyAdd.message }),
    );

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    expect(mockInitiateDeposit).toHaveBeenCalledWith();
  });

  it('initiates a deposit from the unfunded Add funds CTA', () => {
    renderWithLocalization(<MoneyHomePage />);

    fireEvent.click(
      screen.getByRole('button', { name: messages.addFunds.message }),
    );

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    expect(mockInitiateDeposit).toHaveBeenCalledWith();
  });

  it('disables the deposit entry points while a deposit is initiating', () => {
    mockUseMoneyAccountDeposit.mockReturnValue({
      initiateDeposit: mockInitiateDeposit,
      isLoading: true,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.getByRole('button', { name: messages.moneyAdd.message }),
    ).toBeDisabled();
  });

  it('renders the filled-state composition for a funded Money account', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('3475.45'),
      totalFiatFormatted: '$3,475.45',
      totalFiatRaw: '3475.45',
      vaultApyQuery: { isLoading: false },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-balance')).toHaveTextContent('$3,475.45');
    expect(
      screen.getByTestId('money-position-placeholder'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnings.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-position-monthly-value'),
    ).toHaveTextContent('+$12.34');
    expect(
      screen.getByTestId('money-position-lifetime-value'),
    ).toHaveTextContent('+$56.78');
    expect(screen.getByTestId('money-activity-list')).toBeInTheDocument();
    expect(screen.getByTestId('money-potential-earnings')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnOnCrypto.message),
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
    screen.getAllByRole('button').forEach((button) => {
      if (button.textContent === messages.moneyAdd.message) {
        expect(button).toBeEnabled();
      } else {
        expect(button).toBeDisabled();
      }
    });
  });

  it('renders mock activity rows instead of the empty copy', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('3475.45'),
      totalFiatFormatted: '$3,475.45',
      totalFiatRaw: '3475.45',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyActivityItems.mockReturnValue({
      items: MOCK_MONEY_TRANSACTIONS.map(onchainItem),
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-activity-list')).toBeInTheDocument();
    expect(
      screen.queryByText(messages.moneyActivityPlaceholderDescription.message),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/money-activity-row-money-tx-/u)).toHaveLength(
      5,
    );
    expect(screen.getByTestId('money-activity-view-all')).toBeEnabled();
    fireEvent.click(screen.getByTestId('money-activity-view-all'));
    expect(mockNavigate).toHaveBeenCalledWith(MONEY_ACTIVITY_ROUTE);
    expect(
      screen.getByText(messages.moneyActivityDeposited.message),
    ).toBeInTheDocument();
  });

  it('invokes the item click handler when details navigation is enabled', () => {
    const onItemClick = jest.fn();
    const items = MOCK_MONEY_TRANSACTIONS.map(onchainItem);
    mockUseMoneyActivityItemClick.mockReturnValue(onItemClick);
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('3475.45'),
      totalFiatFormatted: '$3,475.45',
      totalFiatRaw: '3475.45',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyActivityItems.mockReturnValue({ items });

    renderWithLocalization(<MoneyHomePage />);

    fireEvent.click(screen.getByTestId(`money-activity-row-${items[0].id}`));
    expect(onItemClick).toHaveBeenCalledWith(items[0]);
  });

  it('shows earnings skeletons during the initial interest load', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('10'),
      totalFiatFormatted: '$10.00',
      totalFiatRaw: '10',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyAccountInterest.mockReturnValue({
      last30DaysQuery: { data: undefined, isLoading: true },
      sinceInceptionQuery: { data: undefined, isLoading: true },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.getByTestId('money-position-monthly-skeleton'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-position-lifetime-skeleton'),
    ).toBeInTheDocument();
  });

  it('uses Mobile-parity fallbacks when interest data is invalid', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.06917567309149253,
      apyPercentFormatted: '6.9%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('120'),
      totalFiatFormatted: '$120.00',
      totalFiatRaw: '120',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyAccountInterest.mockReturnValue({
      last30DaysQuery: {
        data: interestResponse('invalid'),
        isLoading: false,
      },
      sinceInceptionQuery: {
        data: interestResponse('Infinity'),
        isLoading: false,
      },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.getByTestId('money-position-monthly-value'),
    ).toHaveTextContent('+$0.69');
    expect(
      screen.getByTestId('money-position-lifetime-value'),
    ).toHaveTextContent('$0.00');
  });

  it('formats zero interest without a positive prefix', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('10'),
      totalFiatFormatted: '$10.00',
      totalFiatRaw: '10',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyAccountInterest.mockReturnValue({
      last30DaysQuery: {
        data: interestResponse('0'),
        isLoading: false,
      },
      sinceInceptionQuery: {
        data: interestResponse('0.001'),
        isLoading: false,
      },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.getByTestId('money-position-monthly-value'),
    ).toHaveTextContent('$0.00');
    expect(
      screen.getByTestId('money-position-lifetime-value'),
    ).toHaveTextContent('$0.00');
  });

  it('formats negative interest with a minus sign', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('10'),
      totalFiatFormatted: '$10.00',
      totalFiatRaw: '10',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyAccountInterest.mockReturnValue({
      last30DaysQuery: {
        data: interestResponse('-12.34'),
        isLoading: false,
      },
      sinceInceptionQuery: {
        data: interestResponse('-0.001'),
        isLoading: false,
      },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.getByTestId('money-position-monthly-value'),
    ).toHaveTextContent('-$12.34');
    expect(
      screen.getByTestId('money-position-lifetime-value'),
    ).toHaveTextContent('$0.00');
  });

  it('hides earnings and disables interest requests when the flag is off', () => {
    mockSelectMoneyEarningSectionEnabled.mockReturnValue(false);
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('10'),
      totalFiatFormatted: '$10.00',
      totalFiatRaw: '10',
      vaultApyQuery: { isLoading: false },
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(
      screen.queryByTestId('money-position-placeholder'),
    ).not.toBeInTheDocument();
    expect(mockUseMoneyAccountInterest).toHaveBeenCalledWith({
      enabled: false,
    });
    expect(screen.getByTestId('money-activity-list')).toBeInTheDocument();
    expect(screen.getByTestId('money-potential-earnings')).toBeInTheDocument();
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
      apyDecimal: 0.05,
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
    mockUseMoneyDepositTokens.mockReturnValue({
      tokens: [
        {
          address: '0x0000000000000000000000000000000000000001',
          chainId: '0x1',
          decimals: 6,
          image: 'usdc.png',
          moneyFiatAmountUsd: 12,
          secondary: '$12.00',
          symbol: 'USDC',
          title: 'USD Coin',
          tokenFiatAmount: 12,
        },
      ],
      isNoFeeToken: () => true,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-potential-earnings')).toBeInTheDocument();
    expect(screen.getByText('USD Coin')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnOnCryptoNoFee.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-potential-earnings-projection'),
    ).toHaveTextContent('+$0.50');
  });

  it('previews eligible wallet assets on a funded Money account', () => {
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.042,
      apyPercentFormatted: '4.2%',
      isBalanceFetchError: false,
      isBalanceLoading: false,
      tokenTotal: new BigNumber('3475.45'),
      totalFiatFormatted: '$3,475.45',
      totalFiatRaw: '3475.45',
      vaultApyQuery: { isLoading: false },
    });
    mockUseMoneyDepositTokens.mockReturnValue({
      tokens: [
        {
          address: '0x0000000000000000000000000000000000000001',
          chainId: '0x1',
          decimals: 6,
          image: 'usdc.png',
          moneyFiatAmountUsd: 12,
          secondary: '$12.00',
          symbol: 'USDC',
          title: 'USD Coin',
          tokenFiatAmount: 12,
        },
      ],
      isNoFeeToken: () => true,
    });

    renderWithLocalization(<MoneyHomePage />);

    expect(screen.getByTestId('money-potential-earnings')).toBeInTheDocument();
    expect(screen.getByText('USD Coin')).toBeInTheDocument();
    expect(
      screen.getByText(messages.moneyEarnOnCryptoNoFee.message),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('money-potential-earnings-projection'),
    ).toHaveTextContent('+$0.50');
  });
});
