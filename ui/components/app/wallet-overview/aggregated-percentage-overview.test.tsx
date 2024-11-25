import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getIntlLocale } from '../../../ducks/locale/locale';
import {
  getCurrentCurrency,
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getTokensMarketData,
  getPreferences,
  getCurrentChainId,
} from '../../../selectors';
import { useAccountTotalFiatBalance } from '../../../hooks/useAccountTotalFiatBalance';
import { AggregatedPercentageOverview } from './aggregated-percentage-overview';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getCurrentCurrency: jest.fn(),
  getSelectedAccount: jest.fn(),
  getPreferences: jest.fn(),
  getShouldHideZeroBalanceTokens: jest.fn(),
  getTokensMarketData: jest.fn(),
  getCurrentChainId: jest.fn(),
}));

jest.mock('../../../hooks/useAccountTotalFiatBalance', () => ({
  useAccountTotalFiatBalance: jest.fn(),
}));

const mockGetIntlLocale = jest.mocked(getIntlLocale);
const mockGetCurrentCurrency = jest.mocked(getCurrentCurrency);
const mockGetPreferences = jest.mocked(getPreferences);
const mockGetSelectedAccount = jest.mocked(getSelectedAccount);
const mockGetShouldHideZeroBalanceTokens = jest.mocked(
  getShouldHideZeroBalanceTokens,
);
const mockGetTokensMarketData = getTokensMarketData as jest.Mock;
const mockGetCurrentChainId = jest.mocked(getCurrentChainId);

const selectedAccountMock = {
  id: 'd51c0116-de36-4e77-b35b-408d4ea82d01',
  address: '0xa259af9db8172f62ef0373d7dfa893a3e245ace9',
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
  type: 'eip155:eoa',
  metadata: {
    name: 'Account 2',
    importTime: 1725467263902,
    lastSelected: 1725467263905,
    keyring: {
      type: 'Simple Key Pair',
    },
  },
  balance: '0x0f7e2a03e67666',
};

const marketDataMock = {
  '0x0000000000000000000000000000000000000000': {
    tokenAddress: '0x0000000000000000000000000000000000000000',
    currency: 'ETH',
    id: 'ethereum',
    price: 0.999893213343359,
    pricePercentChange1d: -0.7173299395012226,
  },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    currency: 'ETH',
    id: 'dai',
    price: 0.00041861840136257403,
    pricePercentChange1d: -0.0862498076183525,
  },
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    currency: 'ETH',
    id: 'usd-coin',
    price: 0.0004185384042093742,
    pricePercentChange1d: -0.07612981257899307,
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    currency: 'ETH',
    id: 'tether',
    price: 0.0004183549552402562,
    pricePercentChange1d: -0.1357979347463155,
  },
};

const positiveMarketDataMock = {
  '0x0000000000000000000000000000000000000000': {
    tokenAddress: '0x0000000000000000000000000000000000000000',
    currency: 'ETH',
    id: 'ethereum',
    price: 0.999893213343359,
    pricePercentChange1d: 0.7173299395012226,
  },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    currency: 'ETH',
    id: 'dai',
    price: 0.00041861840136257403,
    pricePercentChange1d: 0.0862498076183525,
  },
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    currency: 'ETH',
    id: 'usd-coin',
    price: 0.0004185384042093742,
    pricePercentChange1d: 0.07612981257899307,
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    currency: 'ETH',
    id: 'tether',
    price: 0.0004183549552402562,
    pricePercentChange1d: 0.1357979347463155,
  },
};

const mixedMarketDataMock = {
  '0x0000000000000000000000000000000000000000': {
    tokenAddress: '0x0000000000000000000000000000000000000000',
    currency: 'ETH',
    id: 'ethereum',
    price: 0.999893213343359,
    pricePercentChange1d: -0.7173299395012226,
  },
  '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
    tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    currency: 'ETH',
    id: 'dai',
    price: 0.00041861840136257403,
    pricePercentChange1d: 0.0862498076183525,
  },
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
    tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    currency: 'ETH',
    id: 'usd-coin',
    price: 0.0004185384042093742,
    pricePercentChange1d: -0.07612981257899307,
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    currency: 'ETH',
    id: 'tether',
    price: 0.0004183549552402562,
    pricePercentChange1d: 0.1357979347463155,
  },
};

describe('AggregatedPercentageOverview', () => {
  beforeEach(() => {
    mockGetIntlLocale.mockReturnValue('en-US');
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetPreferences.mockReturnValue({ privacyMode: false });
    mockGetSelectedAccount.mockReturnValue(selectedAccountMock);
    mockGetShouldHideZeroBalanceTokens.mockReturnValue(false);
    mockGetTokensMarketData.mockReturnValue(marketDataMock);
    mockGetCurrentChainId.mockReturnValue('0x1');
    jest.clearAllMocks();
  });

  describe('render', () => {
    it('renders correctly', () => {
      (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
        orderedTokenList: [
          {
            iconUrl: './images/eth_logo.svg',
            symbol: 'ETH',
            fiatBalance: '0',
          },
        ],
        totalFiatBalance: 0,
      });
      const { container } = render(<AggregatedPercentageOverview />);
      expect(container).toMatchSnapshot();
    });
  });

  it('should display zero percentage and amount if balance is zero', () => {
    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      orderedTokenList: [
        {
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
          fiatBalance: '0',
        },
      ],
      totalFiatBalance: 0,
    });

    render(<AggregatedPercentageOverview />);
    const percentageElement = screen.getByText('(+0.00%)');
    const numberElement = screen.getByText('+$0.00');
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display negative aggregated amount and percentage change with all negative market data', () => {
    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      orderedTokenList: [
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          name: 'USDC',
          occurrences: 16,
          symbol: 'USDC',
          balance: '11754897',
          string: '11.75489',
          balanceError: null,
          fiatBalance: '11.77',
        },
        {
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
          fiatBalance: '10.45',
        },
        {
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          name: 'Dai Stablecoin',
          occurrences: 17,
          symbol: 'DAI',
          balance: '6520850325578202013',
          string: '6.52085',
          balanceError: null,
          fiatBalance: '6.53',
        },
        {
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
          name: 'Tether USD',
          occurrences: 15,
          symbol: 'USDT',
          balance: '3379966',
          string: '3.37996',
          balanceError: null,
          fiatBalance: '3.38',
        },
      ],
      totalFiatBalance: 32.13,
    });
    const expectedAmountChange = '-$0.09';
    const expectedPercentageChange = '(-0.29%)';
    render(<AggregatedPercentageOverview />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display positive aggregated amount and percentage change with all positive market data', () => {
    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      orderedTokenList: [
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          name: 'USDC',
          occurrences: 16,
          symbol: 'USDC',
          balance: '11754897',
          string: '11.75489',
          balanceError: null,
          fiatBalance: '11.77',
        },
        {
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
          fiatBalance: '10.45',
        },
        {
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          name: 'Dai Stablecoin',
          occurrences: 17,
          symbol: 'DAI',
          balance: '6520850325578202013',
          string: '6.52085',
          balanceError: null,
          fiatBalance: '6.53',
        },
        {
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
          name: 'Tether USD',
          occurrences: 15,
          symbol: 'USDT',
          balance: '3379966',
          string: '3.37996',
          balanceError: null,
          fiatBalance: '3.38',
        },
      ],
      totalFiatBalance: 32.13,
    });
    mockGetTokensMarketData.mockReturnValue(positiveMarketDataMock);
    const expectedAmountChange = '+$0.09';
    const expectedPercentageChange = '(+0.29%)';
    render(<AggregatedPercentageOverview />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display correct aggregated amount and percentage change with positive and negative market data', () => {
    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      orderedTokenList: [
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          name: 'USDC',
          occurrences: 16,
          symbol: 'USDC',
          balance: '11754897',
          string: '11.75489',
          balanceError: null,
          fiatBalance: '11.77',
        },
        {
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
          fiatBalance: '10.45',
        },
        {
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          name: 'Dai Stablecoin',
          occurrences: 17,
          symbol: 'DAI',
          balance: '6520850325578202013',
          string: '6.52085',
          balanceError: null,
          fiatBalance: '6.53',
        },
        {
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
          name: 'Tether USD',
          occurrences: 15,
          symbol: 'USDT',
          balance: '3379966',
          string: '3.37996',
          balanceError: null,
          fiatBalance: '3.38',
        },
      ],
      totalFiatBalance: 32.13,
    });
    mockGetTokensMarketData.mockReturnValue(mixedMarketDataMock);
    const expectedAmountChange = '-$0.07';
    const expectedPercentageChange = '(-0.23%)';
    render(<AggregatedPercentageOverview />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display correct aggregated amount and percentage when one ERC20 fiatBalance is undefined', () => {
    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      orderedTokenList: [
        {
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
          fiatBalance: '21.12',
        },
        {
          symbol: 'USDC',
          decimals: 6,
          occurrences: 16,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USDC',
          balance: '11411142',
          string: '11.41114',
          balanceError: null,
          fiatBalance: '11.4',
        },
        {
          symbol: 'DAI',
          decimals: 18,
          occurrences: 17,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          name: 'Dai Stablecoin',
          balance: '3000000000000000000',
          string: '3',
          balanceError: null,
          fiatBalance: '3',
        },
        {
          symbol: 'OMNI',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x36e66fbbce51e4cd5bd3c62b637eb411b18949d4.png',
          address: '0x36e66fbbce51e4cd5bd3c62b637eb411b18949d4',
          name: 'Omni Network',
          balance: '2161382310000000000',
          string: '2.16138',
          balanceError: null,
        },
      ],
      totalFiatBalance: 35.52,
    });
    mockGetTokensMarketData.mockReturnValue({
      '0x0000000000000000000000000000000000000000': {
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currency: 'ETH',
        id: 'ethereum',
        price: 0.9999598743668833,
        marketCap: 120194359.82507178,
        allTimeHigh: 2.070186924097962,
        allTimeLow: 0.00018374327407907974,
        totalVolume: 5495085.267342095,
        high1d: 1.022994674939226,
        low1d: 0.9882430202069277,
        circulatingSupply: 120317181.32366,
        dilutedMarketCap: 120194359.82507178,
        marketCapPercentChange1d: -1.46534,
        priceChange1d: -43.27897193472654,
        pricePercentChange1h: 0.39406716228961414,
        pricePercentChange1d: -1.8035792813549656,
      },
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        currency: 'ETH',
        id: 'dai',
        price: 0.00042436994422149745,
        marketCap: 2179091.2357524647,
        allTimeHigh: 0.0005177313319502269,
        allTimeLow: 0.0003742773160055919,
        totalVolume: 25770.310026921918,
        high1d: 0.00042564305405416193,
        low1d: 0.000422254035679609,
        circulatingSupply: 5131139277.03183,
        dilutedMarketCap: 2179157.495602445,
        marketCapPercentChange1d: -2.78163,
        priceChange1d: -0.000450570064429501,
        pricePercentChange1h: 0.044140824068107716,
        pricePercentChange1d: -0.045030461437871275,
      },
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        currency: 'ETH',
        id: 'usd-coin',
        price: 0.00042436994422149745,
        marketCap: 14845337.78504687,
        allTimeHigh: 0.000496512834739152,
        allTimeLow: 0.00037244700843616456,
        totalVolume: 2995848.8988073817,
        high1d: 0.0004252186841099404,
        low1d: 0.00042304081755619566,
        circulatingSupply: 34942418774.2545,
        dilutedMarketCap: 14849047.51464122,
        marketCapPercentChange1d: 0.25951,
        priceChange1d: -0.000469409459860959,
      },
    });
    const expectedAmountChange = '-$0.39';
    const expectedPercentageChange = '(-1.08%)';
    render(<AggregatedPercentageOverview />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });
  it('should display correct aggregated amount and percentage when the native fiatBalance is undefined', () => {
    (useAccountTotalFiatBalance as jest.Mock).mockReturnValue({
      orderedTokenList: [
        {
          iconUrl: './images/eth_logo.svg',
          symbol: 'ETH',
        },
        {
          symbol: 'USDC',
          decimals: 6,
          occurrences: 16,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          name: 'USDC',
          balance: '11411142',
          string: '11.41114',
          balanceError: null,
          fiatBalance: '11.4',
        },
        {
          symbol: 'DAI',
          decimals: 18,
          occurrences: 17,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b175474e89094c44da98b954eedeac495271d0f.png',
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          name: 'Dai Stablecoin',
          balance: '3000000000000000000',
          string: '3',
          balanceError: null,
          fiatBalance: '20',
        },
      ],
      totalFiatBalance: 31.4,
    });
    mockGetTokensMarketData.mockReturnValue({
      '0x0000000000000000000000000000000000000000': {
        tokenAddress: '0x0000000000000000000000000000000000000000',
        currency: 'ETH',
        id: 'ethereum',
        price: 0.9999598743668833,
        marketCap: 120194359.82507178,
        allTimeHigh: 2.070186924097962,
        allTimeLow: 0.00018374327407907974,
        totalVolume: 5495085.267342095,
        high1d: 1.022994674939226,
        low1d: 0.9882430202069277,
        circulatingSupply: 120317181.32366,
        dilutedMarketCap: 120194359.82507178,
        marketCapPercentChange1d: -1.46534,
        priceChange1d: -43.27897193472654,
        pricePercentChange1h: 0.39406716228961414,
        pricePercentChange1d: -1.8035792813549656,
      },
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
        tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        currency: 'ETH',
        id: 'dai',
        price: 0.00042436994422149745,
        marketCap: 2179091.2357524647,
        allTimeHigh: 0.0005177313319502269,
        allTimeLow: 0.0003742773160055919,
        totalVolume: 25770.310026921918,
        high1d: 0.00042564305405416193,
        low1d: 0.000422254035679609,
        circulatingSupply: 5131139277.03183,
        dilutedMarketCap: 2179157.495602445,
        marketCapPercentChange1d: -2.78163,
        priceChange1d: -0.000450570064429501,
        pricePercentChange1h: 0.044140824068107716,
        pricePercentChange1d: -0.045030461437871275,
      },
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        currency: 'ETH',
        id: 'usd-coin',
        price: 0.00042436994422149745,
        marketCap: 14845337.78504687,
        allTimeHigh: 0.000496512834739152,
        allTimeLow: 0.00037244700843616456,
        totalVolume: 2995848.8988073817,
        high1d: 0.0004252186841099404,
        low1d: 0.00042304081755619566,
        circulatingSupply: 34942418774.2545,
        dilutedMarketCap: 14849047.51464122,
        marketCapPercentChange1d: 0.25951,
        priceChange1d: -0.000469409459860959,
      },
    });
    const expectedAmountChange = '-$0.01';
    const expectedPercentageChange = '(-0.03%)';
    render(<AggregatedPercentageOverview />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });
});
