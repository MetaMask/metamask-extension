import { renderHook } from '@testing-library/react-hooks';
import {
  type NetworkConfiguration,
  RpcEndpointType,
} from '@metamask/network-controller';
import {
  getCrossChainTokenExchangeRates,
  getCrossChainMetaMaskCachedBalances,
  getEnabledNetworks,
} from '../selectors';
import {
  getCurrentCurrency,
  getCurrencyRates,
  getTokenBalances,
} from '../ducks/metamask/metamask';
import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import {
  FormattedTokensWithBalances,
  useAccountTotalCrossChainFiatBalance,
} from './useAccountTotalCrossChainFiatBalance';

jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector()),
}));

jest.mock('../selectors', () => ({
  getCrossChainTokenExchangeRates: jest.fn(),
  getCrossChainMetaMaskCachedBalances: jest.fn(),
  getEnabledNetworks: jest.fn(),
}));
jest.mock('../ducks/metamask/metamask', () => ({
  getCurrentCurrency: jest.fn(),
  getCurrencyRates: jest.fn(),
  getTokenBalances: jest.fn(),
}));
jest.mock('../../shared/modules/selectors/networks', () => ({
  getSelectedNetworkClientId: jest.fn(),
  getNetworkConfigurationsByChainId: jest.fn(),
  getCurrentChainId: jest.fn(),
  selectDefaultNetworkClientIdsByChainId: jest.fn(),
  getNetworksMetadata: jest.fn(),
}));

const mockGetCurrencyRates = jest.mocked(getCurrencyRates);
const mockGetTokenBalances = jest.mocked(getTokenBalances);
const mockGetCurrentCurrency = jest.mocked(getCurrentCurrency);
const mockGetNetworkConfigurationsByChainId = jest.mocked(
  getNetworkConfigurationsByChainId,
);
const mockGetCrossChainTokenExchangeRates = jest.mocked(
  getCrossChainTokenExchangeRates,
);
const mockGetCrossChainMetaMaskCachedBalances = jest.mocked(
  getCrossChainMetaMaskCachedBalances,
);
const mockGetEnabledNetworks = jest.mocked(getEnabledNetworks);

const mockUseTokenBalances = jest.fn().mockReturnValue({
  tokenBalances: {
    '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5': {
      '0x1': {
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x2f18e6',
        '0x6B175474E89094C44Da98b954EedeAC495271d0F': '0x378afc9a77b47a30',
      },
    },
  },
});
jest.mock('./useTokenBalances', () => ({
  useTokenBalances: () => mockUseTokenBalances(),
  stringifyBalance: jest.fn(),
}));

const mockCurrencyRates = () => ({
  ETH: {
    conversionDate: 1732040829.246,
    conversionRate: 3124.56,
    usdConversionRate: 3124.56,
  },
  LineaETH: {
    conversionDate: 1732040829.246,
    conversionRate: 3124.56,
    usdConversionRate: 3124.56,
  },
});

const mockNetworkConfigs = () => ({
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
        type: RpcEndpointType.Infura,
        url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  } satisfies NetworkConfiguration,
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
        type: RpcEndpointType.Infura,
        url: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
      },
    ],
  } satisfies NetworkConfiguration,
});

const mockCrossChainTokenExchangeRates = () => ({
  '0x1': {
    '0x0000000000000000000000000000000000000000': 1.0000131552270237,
    '0x4d224452801ACEd8B2F0aebE155379bb5D594381': 0.0003643652288147761,
    '0x6982508145454Ce325dDbE47a25d4ec3d2311933': 6.62249784302e-9,
    '0x6B175474E89094C44Da98b954EedeAC495271d0F': 0.00031961862176734744,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 0.00031993824038911484,
    '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84': 0.9994154684043188,
  },
  '0xe708': {
    '0x0000000000000000000000000000000000000000': 0.9999084951480334,
  },
});

const mockCachedBalances = () => ({
  '0x1': {
    '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5': '0x4e2adedda15fd6',
  },
  '0xe708': {
    '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5': '0x4e2adedda15fd6',
  },
});

const mockTestAccount = () => ({
  id: '7d3a1213-c465-4995-b42a-85e2ccfd2f22',
  address: '0xac7985f2e57609bdd7ad3003e4be868d83e4b6d5',
  options: {},
  methods: [
    'personal_sign',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
  ],
});

const mockFormattedTokensWithBalance = () => [
  {
    chainId: '0x1',
    tokensWithBalances: [
      {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        balance: '3086566',
        string: '3.08656',
        image: '',
        primary: '3.08656',
        secondary: 3.08,
      },
      {
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        symbol: 'DAI',
        decimals: 18,
        balance: '4002288959235586608',
        string: '4.00228',
        image: '',
        primary: '4.00228',
        secondary: 4.0,
      },
    ],
  },
  {
    chainId: '0xe708',
    tokensWithBalances: [],
  },
];

describe('useAccountTotalCrossChainFiatBalance', () => {
  beforeEach(() => {
    mockGetCurrencyRates.mockReturnValue(mockCurrencyRates());
    mockGetTokenBalances.mockReturnValue({});
    mockGetCurrentCurrency.mockReturnValue('usd');
    mockGetNetworkConfigurationsByChainId.mockReturnValue(mockNetworkConfigs());
    mockGetCrossChainTokenExchangeRates.mockReturnValue(
      mockCrossChainTokenExchangeRates(),
    );
    mockGetCrossChainMetaMaskCachedBalances.mockReturnValue(
      mockCachedBalances(),
    );

    mockGetEnabledNetworks.mockReturnValue({
      eip155: {
        '0x1': true,
        '0xe708': true,
      },
      solana: {
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
      },
    });

    jest.clearAllMocks();
  });

  it('should return totalFiatBalance successfully for eth and linea', async () => {
    const testAccount = mockTestAccount();
    const testFormattedTokensWithBalances = mockFormattedTokensWithBalance();

    const expectedResult = {
      tokenFiatBalancesCrossChains: [
        {
          chainId: '0x1',
          nativeFiatValue: '68.75',
          tokenFiatBalances: ['3.09', '4'],
          tokensWithBalances: [
            {
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              balance: '3086566',
              decimals: 6,
              image: '',
              string: '3.08656',
              symbol: 'USDC',
              primary: '3.08656',
              secondary: 3.08,
            },
            {
              address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
              balance: '4002288959235586608',
              decimals: 18,
              image: '',
              string: '4.00228',
              symbol: 'DAI',
              primary: '4.00228',
              secondary: 4.0,
            },
          ],
        },
        {
          chainId: '0xe708',
          nativeFiatValue: '68.75',
          tokenFiatBalances: [],
          tokensWithBalances: [],
        },
      ],
      totalFiatBalance: '144.59',
    };

    const hook = renderHook(() =>
      useAccountTotalCrossChainFiatBalance(
        testAccount,
        testFormattedTokensWithBalances as FormattedTokensWithBalances[],
      ),
    );

    expect(hook.result.current).toStrictEqual(expectedResult);
    expect(hook.result.current.totalFiatBalance).toBe('144.59');
  });

  it('should use known ticket/currency symbol over the user defined network symbol', async () => {
    mockGetCurrencyRates.mockReturnValue({
      ...mockCurrencyRates(),
      BTC: {
        conversionDate: 1747314510.993,
        conversionRate: 102675.66,
        usdConversionRate: 102675.66,
      },
    });

    const networkConfigs = mockNetworkConfigs();
    networkConfigs['0x1'].nativeCurrency = 'BTC'; // Network is using a custom user-defined ticker symbol
    mockGetNetworkConfigurationsByChainId.mockReturnValue(networkConfigs);

    const tokensWithBalance = mockFormattedTokensWithBalance();
    tokensWithBalance[0].chainId = '0x1'; // Token points to ETH

    const hook = renderHook(() =>
      useAccountTotalCrossChainFiatBalance(
        mockTestAccount(),
        tokensWithBalance as FormattedTokensWithBalances[],
      ),
    );

    // Assert the conversion used ETH instead of BTC.
    expect(hook.result.current.totalFiatBalance).toBe('144.59');
  });
});
