import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getIntlLocale } from '../../../ducks/locale/locale';
import {
  getSelectedAccount,
  getShouldHideZeroBalanceTokens,
  getPreferences,
  getMarketData,
  getAllTokens,
  getChainIdsToPoll,
} from '../../../selectors';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { useAccountTotalCrossChainFiatBalance } from '../../../hooks/useAccountTotalCrossChainFiatBalance';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { AggregatedPercentageOverviewCrossChains } from './aggregated-percentage-overview-cross-chains';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

const mockUseGetFormattedTokensPerChain = jest.fn().mockReturnValue({
  formattedTokensWithBalancesPerChain: {},
});
jest.mock('../../../hooks/useGetFormattedTokensPerChain', () => ({
  useGetFormattedTokensPerChain: () => mockUseGetFormattedTokensPerChain(),
}));

jest.mock('../../../ducks/locale/locale', () => ({
  getIntlLocale: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getSelectedAccount: jest.fn(),
  getPreferences: jest.fn(),
  getShouldHideZeroBalanceTokens: jest.fn(),
  getMarketData: jest.fn(),
  getAllTokens: jest.fn(),
  getChainIdsToPoll: jest.fn(),
}));

jest.mock('../../../ducks/metamask/metamask', () => ({
  getCurrentCurrency: jest.fn(),
}));

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

jest.mock('../../../hooks/useAccountTotalCrossChainFiatBalance', () => ({
  useAccountTotalCrossChainFiatBalance: jest.fn(),
}));

const mockGetIntlLocale = getIntlLocale as unknown as jest.Mock;
const mockGetCurrentCurrency = getCurrentCurrency as jest.Mock;
const mockGetPreferences = getPreferences as jest.Mock;
const mockGetSelectedAccount = getSelectedAccount as unknown as jest.Mock;
const mockGetShouldHideZeroBalanceTokens =
  getShouldHideZeroBalanceTokens as jest.Mock;

const mockGetMarketData = getMarketData as jest.Mock;
const mockGetChainIdsToPoll = getChainIdsToPoll as unknown as jest.Mock;
const mockGetNetworkConfigurationsByChainId =
  getNetworkConfigurationsByChainId as unknown as jest.Mock;
const mockGetAllTokens = getAllTokens as jest.Mock;

const allTokens = {
  '0x1': {
    '0x2990079bcdee240329a520d2444386fc119da21a': [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        aggregators: [
          'Metamask',
          'Aave',
          'Bancor',
          'Crypto.com',
          'CoinGecko',
          '1inch',
          'PMM',
          'Sushiswap',
          'Zerion',
          'Lifi',
          'Socket',
          'Squid',
          'Openswap',
          'UniswapLabs',
          'Coinmarketcap',
        ],
        decimals: 6,
        symbol: 'USDC',
      },
    ],
  },
  '0xe708': {
    '0x2990079bcdee240329a520d2444386fc119da21a': [
      {
        address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
        aggregators: ['LineaTeam', 'CoinGecko', 'Lifi', 'Rubic', 'Xswap'],
        decimals: 18,
        symbol: 'DAI',
      },
      {
        address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
        aggregators: [
          'LineaTeam',
          'CoinGecko',
          'Lifi',
          'Squid',
          'Rubic',
          'Xswap',
        ],
        decimals: 6,
        symbol: 'USDT',
      },
    ],
  },
};
const networkConfigsByChainId = {
  '0x1': {
    blockExplorerUrls: ['https://etherscan.io'],
    chainId: '0x1',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Ethereum',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: 'mainnet',
        type: 'infura',
        url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
  '0xaa36a7': {
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    chainId: '0xaa36a7',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Sepolia',
    nativeCurrency: 'SepoliaETH',
    rpcEndpoints: [
      {
        networkClientId: 'sepolia',
        type: 'infura',
        url: 'https://sepolia.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
  '0xe705': {
    blockExplorerUrls: ['https://sepolia.lineascan.build'],
    chainId: '0xe705',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Linea Sepolia',
    nativeCurrency: 'LineaETH',
    rpcEndpoints: [
      {
        networkClientId: 'linea-sepolia',
        type: 'infura',
        url: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
  '0xe708': {
    blockExplorerUrls: ['https://lineascan.build'],
    chainId: '0xe708',
    defaultBlockExplorerUrlIndex: 0,
    defaultRpcEndpointIndex: 0,
    name: 'Linea',
    nativeCurrency: 'ETH',
    rpcEndpoints: [
      {
        networkClientId: 'linea-mainnet',
        type: 'infura',
        url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  },
};
const selectedAccountMock = {
  id: 'd51c0116-de36-4e77-b35b-408d4ea82d01',
  address: '0x2990079bcdee240329a520d2444386fc119da21a',
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

const crossChainMarketDataMock = {
  '0x1': {
    '0x0000000000000000000000000000000000000000': {
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currency: 'ETH',
      id: 'ethereum',
      price: 0.9999974728621198,
      pricePercentChange1d: 0.8551361112650235,
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      currency: 'ETH',
      id: 'dai',
      price: 0.00031298237681361845,
      pricePercentChange1d: -0.19413664311573345,
    },
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      currency: 'ETH',
      id: 'usd-coin',
      price: 0.00031298237681361845,
      pricePercentChange1d: -0.08092791615953396,
    },
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
      tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      currency: 'ETH',
      id: 'tether',
      price: 0.00031329535919043206,
      pricePercentChange1d: -0.09790827980452445,
    },
  },
  '0xaa36a7': {},
  '0xe705': {},
  '0xe708': {
    '0x0000000000000000000000000000000000000000': {
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currency: 'ETH',
      id: 'ethereum',
      price: 0.9999974728621198,
      pricePercentChange1d: 0.8551361112650235,
    },
    '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5': {
      tokenAddress: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
      currency: 'ETH',
      id: 'bridged-dai-stablecoin-linea',
      price: 0.00031298237681361845,
      pricePercentChange1d: -0.22242916875537241,
    },
    '0xA219439258ca9da29E9Cc4cE5596924745e12B93': {
      tokenAddress: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
      currency: 'ETH',
      id: 'bridged-tether-linea',
      price: 0.0003136083415672457,
      pricePercentChange1d: -0.2013707959252836,
    },
  },
};

const negativeCrossChainMarketDataMock = {
  '0x1': {
    '0x0000000000000000000000000000000000000000': {
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currency: 'ETH',
      id: 'ethereum',
      price: 0.9999974728621198,
      pricePercentChange1d: -0.8551361112650235,
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      currency: 'ETH',
      id: 'dai',
      price: 0.00031298237681361845,
      pricePercentChange1d: -0.19413664311573345,
    },
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      currency: 'ETH',
      id: 'usd-coin',
      price: 0.00031298237681361845,
      pricePercentChange1d: -0.08092791615953396,
    },
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
      tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      currency: 'ETH',
      id: 'tether',
      price: 0.00031329535919043206,
      pricePercentChange1d: -0.09790827980452445,
    },
  },
  '0xaa36a7': {},
  '0xe705': {},
  '0xe708': {
    '0x0000000000000000000000000000000000000000': {
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currency: 'ETH',
      id: 'ethereum',
      price: 0.9999974728621198,
      pricePercentChange1d: -0.8551361112650235,
    },
    '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5': {
      tokenAddress: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
      currency: 'ETH',
      id: 'bridged-dai-stablecoin-linea',
      price: 0.00031298237681361845,
      pricePercentChange1d: -0.22242916875537241,
    },
    '0xA219439258ca9da29E9Cc4cE5596924745e12B93': {
      tokenAddress: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
      currency: 'ETH',
      id: 'bridged-tether-linea',
      price: 0.0003136083415672457,
      pricePercentChange1d: -0.2013707959252836,
    },
  },
};
const positiveCrossChainMarketDataMock = {
  '0x1': {
    '0x0000000000000000000000000000000000000000': {
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currency: 'ETH',
      id: 'ethereum',
      price: 0.9999974728621198,
      pricePercentChange1d: 0.8551361112650235,
    },
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': {
      tokenAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      currency: 'ETH',
      id: 'dai',
      price: 0.00031298237681361845,
      pricePercentChange1d: 0.19413664311573345,
    },
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      currency: 'ETH',
      id: 'usd-coin',
      price: 0.00031298237681361845,
      pricePercentChange1d: 0.08092791615953396,
    },
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
      tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      currency: 'ETH',
      id: 'tether',
      price: 0.00031329535919043206,
      pricePercentChange1d: 0.09790827980452445,
    },
  },
  '0xaa36a7': {},
  '0xe705': {},
  '0xe708': {
    '0x0000000000000000000000000000000000000000': {
      tokenAddress: '0x0000000000000000000000000000000000000000',
      currency: 'ETH',
      id: 'ethereum',
      price: 0.9999974728621198,
      pricePercentChange1d: 0.8551361112650235,
    },
    '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5': {
      tokenAddress: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
      currency: 'ETH',
      id: 'bridged-dai-stablecoin-linea',
      price: 0.00031298237681361845,
      pricePercentChange1d: 0.22242916875537241,
    },
    '0xA219439258ca9da29E9Cc4cE5596924745e12B93': {
      tokenAddress: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
      currency: 'ETH',
      id: 'bridged-tether-linea',
      price: 0.0003136083415672457,
      pricePercentChange1d: 0.2013707959252836,
    },
  },
};
describe('AggregatedPercentageOverviewCrossChains', () => {
  beforeEach(() => {
    mockGetIntlLocale.mockReturnValue('en-US');
    mockGetCurrentCurrency.mockReturnValue('USD');
    mockGetPreferences.mockReturnValue({ privacyMode: false });
    mockGetSelectedAccount.mockReturnValue(selectedAccountMock);
    mockGetShouldHideZeroBalanceTokens.mockReturnValue(false);

    mockGetMarketData.mockReturnValue(crossChainMarketDataMock);
    mockGetChainIdsToPoll.mockReturnValue(['0x1']);
    mockGetNetworkConfigurationsByChainId.mockReturnValue(
      networkConfigsByChainId,
    );
    mockGetAllTokens.mockReturnValue(allTokens);

    jest.clearAllMocks();
  });

  describe('render', () => {
    it('renders correctly', () => {
      (useAccountTotalCrossChainFiatBalance as jest.Mock).mockReturnValue({
        tokenFiatBalancesCrossChains: [
          {
            chainId: '0x1',
            tokensWithBalances: [
              {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                symbol: 'USDC',
                decimals: 6,
              },
            ],
            tokenFiatBalances: ['70'],
            nativeFiatValue: '69.96',
          },
          {
            chainId: '0xe708',
            tokensWithBalances: [
              {
                address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
                symbol: 'DAI',
                decimals: 18,
              },
              {
                address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
                symbol: 'USDT',
                decimals: 6,
              },
            ],
            tokenFiatBalances: ['50', '100'],
            nativeFiatValue: '0',
          },
        ],
        totalFiatBalance: 289.96,
      });
      const { container } = render(<AggregatedPercentageOverviewCrossChains />);
      expect(container).toMatchSnapshot();
    });
  });

  it('should display zero percentage and amount if balance is zero across chains', () => {
    (useAccountTotalCrossChainFiatBalance as jest.Mock).mockReturnValue({
      tokenFiatBalancesCrossChains: [
        {
          chainId: '0x1',
          tokensWithBalances: [],
          tokenFiatBalances: [],
          nativeFiatValue: '0',
        },
        {
          chainId: '0xe708',
          tokensWithBalances: [],
          tokenFiatBalances: [],
          nativeFiatValue: '0',
        },
      ],
      totalFiatBalance: 0,
    });

    render(<AggregatedPercentageOverviewCrossChains />);
    const percentageElement = screen.getByText('(+0.00%)');
    const numberElement = screen.getByText('+$0.00');
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display negative aggregated amount and percentage change with all negative market data cross chains', () => {
    (useAccountTotalCrossChainFiatBalance as jest.Mock).mockReturnValue({
      tokenFiatBalancesCrossChains: [
        {
          chainId: '0x1',
          tokensWithBalances: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              symbol: 'USDC',
              decimals: 6,
            },
          ],
          tokenFiatBalances: ['70'],
          nativeFiatValue: '69.96',
        },
        {
          chainId: '0xe708',
          tokensWithBalances: [
            {
              address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
              symbol: 'DAI',
              decimals: 18,
            },
            {
              address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
              symbol: 'USDT',
              decimals: 6,
            },
          ],
          tokenFiatBalances: ['50', '100'],
          nativeFiatValue: '0',
        },
      ],
      totalFiatBalance: 289.96,
    });
    mockGetMarketData.mockReturnValue(negativeCrossChainMarketDataMock);
    const expectedAmountChange = '-$0.97';
    const expectedPercentageChange = '(-0.33%)';
    render(<AggregatedPercentageOverviewCrossChains />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display positive aggregated amount and percentage change with all positive market data', () => {
    (useAccountTotalCrossChainFiatBalance as jest.Mock).mockReturnValue({
      tokenFiatBalancesCrossChains: [
        {
          chainId: '0x1',
          tokensWithBalances: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              symbol: 'USDC',
              decimals: 6,
            },
          ],
          tokenFiatBalances: ['70'],
          nativeFiatValue: '69.96',
        },
        {
          chainId: '0xe708',
          tokensWithBalances: [
            {
              address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
              symbol: 'DAI',
              decimals: 18,
            },
            {
              address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
              symbol: 'USDT',
              decimals: 6,
            },
          ],
          tokenFiatBalances: ['50', '100'],
          nativeFiatValue: '0',
        },
      ],
      totalFiatBalance: 289.96,
    });
    mockGetMarketData.mockReturnValue(positiveCrossChainMarketDataMock);
    const expectedAmountChange = '+$0.96';
    const expectedPercentageChange = '(+0.33%)';
    render(<AggregatedPercentageOverviewCrossChains />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });

  it('should display correct aggregated amount and percentage change with positive and negative market data', () => {
    (useAccountTotalCrossChainFiatBalance as jest.Mock).mockReturnValue({
      tokenFiatBalancesCrossChains: [
        {
          chainId: '0x1',
          tokensWithBalances: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              symbol: 'USDC',
              decimals: 6,
            },
          ],
          tokenFiatBalances: ['70'],
          nativeFiatValue: '69.96',
        },
        {
          chainId: '0xe708',
          tokensWithBalances: [
            {
              address: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5',
              symbol: 'DAI',
              decimals: 18,
            },
            {
              address: '0xA219439258ca9da29E9Cc4cE5596924745e12B93',
              symbol: 'USDT',
              decimals: 6,
            },
          ],
          tokenFiatBalances: ['50', '100'],
          nativeFiatValue: '0',
        },
      ],
      totalFiatBalance: 289.96,
    });
    const expectedAmountChange = '+$0.22';
    const expectedPercentageChange = '(+0.08%)';
    render(<AggregatedPercentageOverviewCrossChains />);
    const percentageElement = screen.getByText(expectedPercentageChange);
    const numberElement = screen.getByText(expectedAmountChange);
    expect(percentageElement).toBeInTheDocument();
    expect(numberElement).toBeInTheDocument();
  });
});
