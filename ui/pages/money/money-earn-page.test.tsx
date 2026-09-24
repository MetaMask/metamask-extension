import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithLocalization } from '../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import {
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { getPrivacyMode } from '../../selectors/selectors';
import { useMoneyAnalytics } from '../../hooks/money/useMoneyAnalytics';
import { createMoneyAnalyticsMock } from '../../hooks/money/useMoneyAnalytics.mock';
import type { MoneyDepositToken } from '../../hooks/money/money-deposit-token-utils';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from './constants/money-events';
import { MoneyEarnPage } from './money-earn-page';

const mockUseMoneyAccountAvailability = jest.fn();
const mockUseMoneyAccountBalance = jest.fn();
const mockUseMoneyDepositTokens = jest.fn();
const mockUseMoneyAddDepositToken = jest.fn();
const mockInitiateDeposit = jest.fn();
const mockHandleAddToken = jest.fn();
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();
const mockGetPrivacyMode = jest.mocked(getPrivacyMode);

const createToken = (
  index: number,
  overrides: Partial<MoneyDepositToken> = {},
): MoneyDepositToken => ({
  address: `0x${index.toString().padStart(40, '0')}`,
  chainId: '0x1',
  decimals: 18,
  image: 'token.png',
  symbol: `TOK${index}`,
  title: `Token ${index}`,
  moneyFiatAmountUsd: index * 100,
  ...overrides,
});

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/selectors', () => ({
  ...jest.requireActual('../../selectors/selectors'),
  getPrivacyMode: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => (
    <div data-testid="navigate" data-to={to} />
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => mockUseLocation(),
}));

jest.mock('../../hooks/money/use-money-account-availability', () => ({
  useMoneyAccountAvailability: () => mockUseMoneyAccountAvailability(),
}));

jest.mock('../../hooks/money/useMoneyAccountBalance', () => ({
  useMoneyAccountBalance: () => mockUseMoneyAccountBalance(),
}));

jest.mock('../../hooks/money/use-money-deposit-tokens', () => ({
  useMoneyDepositTokens: () => mockUseMoneyDepositTokens(),
}));

jest.mock('../../hooks/money/use-money-add-deposit-token', () => ({
  useMoneyAddDepositToken: (options: unknown) =>
    mockUseMoneyAddDepositToken(options),
}));

const mockMoneyAnalytics = createMoneyAnalyticsMock();
jest.mock('../../hooks/money/useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);

describe('MoneyEarnPage', () => {
  const tokens = Array.from({ length: 6 }, (_, index) =>
    createToken(index + 1),
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({ key: 'ci9s3nlq' });
    mockUseMoneyAnalytics.mockReturnValue(mockMoneyAnalytics);
    mockGetPrivacyMode.mockReturnValue(false);
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: {
        isAvailable: true,
        address: '0x0000000000000000000000000000000000000001',
      },
      isLoading: false,
    });
    mockUseMoneyAccountBalance.mockReturnValue({
      apyDecimal: 0.04,
    });
    mockUseMoneyDepositTokens.mockReturnValue({
      tokens,
      isNoFeeToken: () => false,
    });
    mockInitiateDeposit.mockResolvedValue(undefined);
    mockUseMoneyAddDepositToken.mockReturnValue({
      handleAddToken: mockHandleAddToken,
      initiateDeposit: mockInitiateDeposit,
      isDepositLoading: false,
    });
  });

  it('redirects home when Money Account is unavailable', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: false,
    });

    renderWithLocalization(<MoneyEarnPage />);

    expect(screen.getByTestId('navigate')).toHaveAttribute(
      'data-to',
      DEFAULT_ROUTE,
    );
  });

  it('shows a loading state while availability is resolving', () => {
    mockUseMoneyAccountAvailability.mockReturnValue({
      availability: { isAvailable: false },
      isLoading: true,
    });

    renderWithLocalization(<MoneyEarnPage />);

    expect(screen.getByTestId('money-earn-loading')).toBeInTheDocument();
  });

  it('renders every eligible token, not only the home preview count', () => {
    renderWithLocalization(<MoneyEarnPage />);

    expect(screen.getByTestId('money-earn-page')).toBeInTheDocument();
    expect(
      screen.getAllByTestId('money-potential-earnings-token-row'),
    ).toHaveLength(6);
    expect(screen.getByText('Token 6')).toBeInTheDocument();
    expect(mockUseMoneyAddDepositToken).toHaveBeenCalledWith({
      screenName: MoneyScreenName.MoneyEarnOnCrypto,
    });
    expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
      screenName: MoneyScreenName.MoneyEarnOnCrypto,
    });
  });

  it('navigates back when the back button is clicked', () => {
    renderWithLocalization(<MoneyEarnPage />);

    fireEvent.click(screen.getByTestId('money-earn-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('navigates to Money home when the page was opened directly by URL', () => {
    mockUseLocation.mockReturnValue({ key: 'default' });

    renderWithLocalization(<MoneyEarnPage />);

    fireEvent.click(screen.getByTestId('money-earn-back-button'));

    expect(mockNavigate).toHaveBeenCalledWith(MONEY_HOME_ROUTE, {
      replace: true,
      state: { fromFreshTab: true },
    });
  });

  it('passes the row token to handleAddToken when Add is clicked', () => {
    renderWithLocalization(<MoneyEarnPage />);

    fireEvent.click(
      screen.getAllByTestId('money-potential-earnings-token-add')[2],
    );

    expect(mockHandleAddToken).toHaveBeenCalledWith(tokens[2], 2, 6);
  });

  it('initiates a deposit without preferred token when Convert your crypto is clicked', () => {
    renderWithLocalization(<MoneyEarnPage />);

    fireEvent.click(screen.getByTestId('money-earn-convert-cta'));

    expect(mockInitiateDeposit).toHaveBeenCalledTimes(1);
    expect(mockInitiateDeposit).toHaveBeenCalledWith();
    expect(mockMoneyAnalytics.trackButtonClicked).toHaveBeenCalledWith({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      componentName: MoneyComponentName.PotentialEarningsSectionFooter,
      labelKey: 'moneyConvertYourCrypto',
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
  });
});
