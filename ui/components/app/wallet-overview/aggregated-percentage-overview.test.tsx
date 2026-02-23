import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  getSelectedAccount,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
  getMarketData,
  getPreferences,
  selectAnyEnabledNetworksAreAvailable,
} from '../../../selectors';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import { getHistoricalMultichainAggregatedBalance } from '../../../selectors/assets';
import {
  AggregatedPercentageOverview,
  AggregatedMultichainPercentageOverview,
} from './aggregated-percentage-overview';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getSelectedAccount: jest.fn(),
  getSelectedInternalAccount: jest.fn(),
  getShouldHideZeroBalanceTokens: jest.fn(),
  getMarketData: jest.fn(),
  getPreferences: jest.fn(),
  selectAnyEnabledNetworksAreAvailable: jest.fn(),
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getCurrentChainId: jest.fn(),
}));

jest.mock('../../../hooks/useAccountTotalFiatBalance', () => ({
  useAccountTotalFiatBalance: jest.fn(),
}));

jest.mock('../../../selectors/assets', () => ({
  getHistoricalMultichainAggregatedBalance: jest.fn(),
}));

const mockGetIntlLocale = jest.mocked(getIntlLocale);
const mockGetCurrentCurrency = jest.mocked(getCurrentCurrency);
const mockGetSelectedAccount = jest.mocked(getSelectedAccount);
const mockGetSelectedInternalAccount = jest.mocked(getSelectedInternalAccount);
const mockGetShouldHideZeroBalanceTokens = jest.mocked(
  getShouldHideZeroBalanceTokens,
);
const mockGetMarketData = jest.mocked(getMarketData);
const mockGetPreferences = jest.mocked(getPreferences);
const mockSelectAnyEnabledNetworksAreAvailable = jest.mocked(
  selectAnyEnabledNetworksAreAvailable,
);
const mockGetCurrentChainId = jest.mocked(getCurrentChainId);
const mockUseAccountTotalFiatBalance = jest.mocked(useAccountTotalFiatBalance);
const mockGetHistoricalMultichainAggregatedBalance = jest.mocked(
  getHistoricalMultichainAggregatedBalance,
);

const accountMock = {
  id: 'account-id',
  address: '0x0000000000000000000000000000000000000001',
  options: {},
  methods: [],
  type: 'eip155:eoa' as const,
  metadata: {
    name: 'Account 1',
    importTime: 0,
    nameLastUpdatedAt: undefined,
    snap: undefined,
    lastSelected: undefined,
    keyring: {
      type: 'HD Key Tree',
    },
  },
  scopes: ['eip155:0'] as `${string}:${string}`[],
};

function createHistoricalBalances(percentChange: number, amountChange: number) {
  return {
    PT1H: { balance: 0, percentChange: 0, amountChange: 0 },
    P1D: { balance: 100, percentChange, amountChange },
    P7D: { balance: 0, percentChange: 0, amountChange: 0 },
    P14D: { balance: 0, percentChange: 0, amountChange: 0 },
    P30D: { balance: 0, percentChange: 0, amountChange: 0 },
    P200D: { balance: 0, percentChange: 0, amountChange: 0 },
    P1Y: { balance: 0, percentChange: 0, amountChange: 0 },
  };
}

function setupDefaults({
  totalFiatBalance,
  nativePercentChange,
  anyEnabledNetworksAreAvailable = true,
}: {
  totalFiatBalance: number;
  nativePercentChange: number;
  anyEnabledNetworksAreAvailable?: boolean;
}) {
  mockGetIntlLocale.mockReturnValue('en-US');
  mockGetCurrentCurrency.mockReturnValue('USD');
  mockGetSelectedAccount.mockReturnValue(accountMock);
  mockGetSelectedInternalAccount.mockReturnValue(accountMock);
  mockGetShouldHideZeroBalanceTokens.mockReturnValue(false);
  mockGetPreferences.mockReturnValue({ privacyMode: false });
  mockSelectAnyEnabledNetworksAreAvailable.mockReturnValue(
    anyEnabledNetworksAreAvailable,
  );
  mockGetCurrentChainId.mockReturnValue('0x1');

  mockGetMarketData.mockReturnValue({
    [getNativeTokenAddress('0x1')]: {
      tokenAddress: getNativeTokenAddress('0x1'),
      pricePercentChange1d: nativePercentChange,
    },
  });

  mockGetHistoricalMultichainAggregatedBalance.mockReturnValue(
    createHistoricalBalances(0, 0),
  );

  mockUseAccountTotalFiatBalance.mockReturnValue({
    formattedFiat: '$0.00',
    totalWeiBalance: '0x0',
    orderedTokenList: [
      {
        symbol: 'ETH',
        fiatBalance: String(totalFiatBalance),
      },
    ],
    totalFiatBalance: String(totalFiatBalance),
    tokensWithBalances: [],
    loading: false,
    mergedRates: {},
  });
}

describe('AggregatedPercentageOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows zero amount and percentage when the current balance is zero', () => {
    setupDefaults({ totalFiatBalance: 0, nativePercentChange: 0 });

    render(<AggregatedPercentageOverview trailingChild={() => null} />);

    expect(screen.getByTestId('aggregated-value-change')).toHaveTextContent(
      '+$0.00',
    );
    expect(
      screen.getByTestId('aggregated-percentage-change'),
    ).toHaveTextContent('(+0.00%)');
  });

  it('shows positive amount and success color when 1d change is positive', () => {
    setupDefaults({ totalFiatBalance: 200, nativePercentChange: 100 });

    render(<AggregatedPercentageOverview trailingChild={() => null} />);

    const value = screen.getByTestId('aggregated-value-change');
    const percent = screen.getByTestId('aggregated-percentage-change');

    expect(value).toHaveTextContent('+$100.00');
    expect(percent).toHaveTextContent('(+100.00%)');
    expect(value).toHaveClass('mm-box--color-success-default');
    expect(percent).toHaveClass('mm-box--color-success-default');
  });

  it('shows negative amount and error color when 1d change is negative', () => {
    setupDefaults({ totalFiatBalance: 100, nativePercentChange: -50 });

    render(<AggregatedPercentageOverview trailingChild={() => null} />);

    const value = screen.getByTestId('aggregated-value-change');
    const percent = screen.getByTestId('aggregated-percentage-change');

    expect(value).toHaveTextContent('-$100.00');
    expect(percent).toHaveTextContent('(-50.00%)');
    expect(value).toHaveClass('mm-box--color-error-default');
    expect(percent).toHaveClass('mm-box--color-error-default');
  });
});

describe('AggregatedMultichainPercentageOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIntlLocale.mockReturnValue('en-US');
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockSelectAnyEnabledNetworksAreAvailable.mockReturnValue(true);
    mockGetSelectedInternalAccount.mockReturnValue(accountMock);
  });

  it('shows neutral values when 1d change is zero', () => {
    mockGetHistoricalMultichainAggregatedBalance.mockReturnValue(
      createHistoricalBalances(0, 0),
    );

    render(
      <AggregatedMultichainPercentageOverview trailingChild={() => null} />,
    );

    const value = screen.getByTestId('aggregated-value-change');
    const percent = screen.getByTestId('aggregated-percentage-change');

    expect(value).toHaveTextContent('+$0.00');
    expect(percent).toHaveTextContent('(+0.00%)');
    expect(value).toHaveClass('mm-box--color-text-alternative');
    expect(percent).toHaveClass('mm-box--color-text-alternative');
  });

  it('shows positive values and success color when 1d change is positive', () => {
    mockGetHistoricalMultichainAggregatedBalance.mockReturnValue(
      createHistoricalBalances(12.34, 45.67),
    );

    render(
      <AggregatedMultichainPercentageOverview trailingChild={() => null} />,
    );

    const value = screen.getByTestId('aggregated-value-change');
    const percent = screen.getByTestId('aggregated-percentage-change');

    expect(value).toHaveTextContent('+$45.67');
    expect(percent).toHaveTextContent('(+12.34%)');
    expect(value).toHaveClass('mm-box--color-success-default');
    expect(percent).toHaveClass('mm-box--color-success-default');
  });

  it('shows negative values and error color when 1d change is negative', () => {
    mockGetHistoricalMultichainAggregatedBalance.mockReturnValue(
      createHistoricalBalances(-10, -25),
    );

    render(
      <AggregatedMultichainPercentageOverview trailingChild={() => null} />,
    );

    const value = screen.getByTestId('aggregated-value-change');
    const percent = screen.getByTestId('aggregated-percentage-change');

    expect(value).toHaveTextContent('-$25.00');
    expect(percent).toHaveTextContent('(-10.00%)');
    expect(value).toHaveClass('mm-box--color-error-default');
    expect(percent).toHaveClass('mm-box--color-error-default');
  });
});
