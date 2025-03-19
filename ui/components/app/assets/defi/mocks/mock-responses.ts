import type { DefiPositionResponse } from '../fetch-positions';

/**
 * Entries are from different chains
 */
export const MOCK_DEFI_RESPONSE_MULTI_CHAIN: DefiPositionResponse[] = [
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_MULTI_CHAIN',
    name: 'Aave v3 AToken-MOCK_DEFI_RESPONSE_MULTI_CHAIN',
    description: 'Aave v3 defi adapter for yield-generating token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'supply',
    chainId: 1,
    productId: 'a-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
        name: 'Aave Ethereum WETH',
        symbol: 'aEthWETH',
        decimals: 18,
        balanceRaw: '5000000000000000000',
        balance: 5,
        type: 'protocol',
        tokens: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '5000000000000000000',
            balance: 5,
            price: 1000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
        ],
      },
    ],
  },
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_MULTI_CHAIN',
    name: 'Aave v3 AToken-MOCK_DEFI_RESPONSE_MULTI_CHAIN',
    description: 'Aave v3 defi adapter for yield-generating token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'supply',
    chainId: 59144,
    productId: 'a-token',
    chainName: 'linea',
    success: true,
    tokens: [
      {
        address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
        name: 'Aave Ethereum WETH',
        symbol: 'aEthWETH',
        decimals: 18,
        balanceRaw: '5000000000000000000',
        balance: 5,
        type: 'protocol',
        tokens: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '5000000000000000000',
            balance: 5,
            price: 1000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
        ],
      },
    ],
  },
];

/**
 * The first entry is a failed entry
 */
export const MOCK_DEFI_RESPONSE_FAILED_ENTRY: DefiPositionResponse[] = [
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_FAILED_ENTRY',
    name: 'Aave v3 VariableDebtToken-MOCK_DEFI_RESPONSE_FAILED_ENTRY',
    description: 'Aave v3 defi adapter for variable interest-accruing token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'borrow',
    chainId: 1,
    productId: 'variable-debt-token',
    chainName: 'ethereum',
    success: false,
    error: {
      message: 'Failed to fetch positions',
    },
  },
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_FAILED_ENTRY',
    name: 'Aave v3 AToken-MOCK_DEFI_RESPONSE_FAILED_ENTRY',
    description: 'Aave v3 defi adapter for yield-generating token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'supply',
    chainId: 1,
    productId: 'a-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
        name: 'Aave Ethereum WETH',
        symbol: 'aEthWETH',
        decimals: 18,
        balanceRaw: '5000000000000000000',
        balance: 5,
        type: 'protocol',
        tokens: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '5000000000000000000',
            balance: 5,
            price: 1000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
        ],
      },
    ],
  },
];

/**
 * The second entry has no price
 */
export const MOCK_DEFI_RESPONSE_NO_PRICES: DefiPositionResponse[] = [
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_NO_PRICES',
    name: 'Aave v3 AToken-MOCK_DEFI_RESPONSE_NO_PRICES',
    description: 'Aave v3 defi adapter for yield-generating token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'supply',
    chainId: 1,
    productId: 'a-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
        name: 'Aave Ethereum WETH',
        symbol: 'aEthWETH',
        decimals: 18,
        balanceRaw: '40000000000000000',
        balance: 0.04,
        type: 'protocol',
        tokens: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '40000000000000000',
            balance: 0.04,
            price: 1000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
        ],
      },
      {
        address: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8',
        name: 'Aave Ethereum WBTC',
        symbol: 'aEthWBTC',
        decimals: 8,
        balanceRaw: '300000000',
        balance: 3,
        type: 'protocol',
        tokens: [
          {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            name: 'Wrapped BTC',
            symbol: 'WBTC',
            decimals: 8,
            type: 'underlying',
            balanceRaw: '300000000',
            balance: 3,
            price: undefined,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
          },
        ],
      },
    ],
  },
];

/**
 * The second entry is a borrow position
 */
export const MOCK_DEFI_RESPONSE_BORROW: DefiPositionResponse[] = [
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_BORROW',
    name: 'Aave v3 AToken-MOCK_DEFI_RESPONSE_BORROW',
    description: 'Aave v3 defi adapter for yield-generating token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'supply',
    chainId: 1,
    productId: 'a-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
        name: 'Aave Ethereum WETH',
        symbol: 'aEthWETH',
        decimals: 18,
        balanceRaw: '40000000000000000',
        balance: 0.04,
        type: 'protocol',
        tokens: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '40000000000000000',
            balance: 0.04,
            price: 1000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
        ],
      },
      {
        address: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8',
        name: 'Aave Ethereum WBTC',
        symbol: 'aEthWBTC',
        decimals: 8,
        balanceRaw: '300000000',
        balance: 3,
        type: 'protocol',
        tokens: [
          {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            name: 'Wrapped BTC',
            symbol: 'WBTC',
            decimals: 8,
            type: 'underlying',
            balanceRaw: '300000000',
            balance: 3,
            price: 500,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
          },
        ],
      },
    ],
  },
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_BORROW',
    name: 'Aave v3 VariableDebtToken-MOCK_DEFI_RESPONSE_BORROW',
    description: 'Aave v3 defi adapter for variable interest-accruing token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'borrow',
    chainId: 1,
    productId: 'variable-debt-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x6df1C1E379bC5a00a7b4C6e67A203333772f45A8',
        name: 'Aave Ethereum Variable Debt USDT',
        symbol: 'variableDebtEthUSDT',
        decimals: 6,
        balanceRaw: '1000000000',
        type: 'protocol',
        tokens: [
          {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            type: 'underlying',
            balanceRaw: '1000000000',
            balance: 1000,
            price: 1,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
          },
        ],
        balance: 1000,
      },
    ],
  },
];

/**
 * Complex mock with multiple chains, failed entries, borrow positions, etc.
 */
export const MOCK_DEFI_RESPONSE_COMPLEX: DefiPositionResponse[] = [
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_COMPLEX',
    name: 'Aave v3 AToken-MOCK_DEFI_RESPONSE_COMPLEX',
    description: 'Aave v3 defi adapter for yield-generating token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'supply',
    chainId: 1,
    productId: 'a-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
        name: 'Aave Ethereum WETH',
        symbol: 'aEthWETH',
        decimals: 18,
        balanceRaw: '40000000000000000',
        balance: 0.04,
        type: 'protocol',
        tokens: [
          {
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '40000000000000000',
            balance: 0.04,
            price: 1000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
          },
        ],
      },
      {
        address: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8',
        name: 'Aave Ethereum WBTC',
        symbol: 'aEthWBTC',
        decimals: 8,
        balanceRaw: '300000000',
        balance: 3,
        type: 'protocol',
        tokens: [
          {
            address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
            name: 'Wrapped BTC',
            symbol: 'WBTC',
            decimals: 8,
            type: 'underlying',
            balanceRaw: '300000000',
            balance: 3,
            price: 500,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
          },
        ],
      },
    ],
  },
  {
    protocolId: 'aave-v3-MOCK_DEFI_RESPONSE_COMPLEX',
    name: 'Aave v3 VariableDebtToken-MOCK_DEFI_RESPONSE_COMPLEX',
    description: 'Aave v3 defi adapter for variable interest-accruing token',
    siteUrl: 'https://aave.com/',
    iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    positionType: 'borrow',
    chainId: 1,
    productId: 'variable-debt-token',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x6df1C1E379bC5a00a7b4C6e67A203333772f45A8',
        name: 'Aave Ethereum Variable Debt USDT',
        symbol: 'variableDebtEthUSDT',
        decimals: 6,
        balanceRaw: '1000000000',
        type: 'protocol',
        tokens: [
          {
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            type: 'underlying',
            balanceRaw: '1000000000',
            balance: 1000,
            price: 1,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
          },
        ],
        balance: 1000,
      },
    ],
  },
  {
    protocolId: 'lido-MOCK_DEFI_RESPONSE_COMPLEX',
    name: 'Lido wstEth-MOCK_DEFI_RESPONSE_COMPLEX',
    description: 'Lido defi adapter for wstEth',
    siteUrl: 'https://stake.lido.fi/wrap',
    iconUrl:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
    positionType: 'stake',
    chainId: 1,
    productId: 'wst-eth',
    chainName: 'ethereum',
    success: true,
    tokens: [
      {
        address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
        name: 'Wrapped liquid staked Ether 2.0',
        symbol: 'wstETH',
        decimals: 18,
        balanceRaw: '800000000000000000000',
        balance: 800,
        type: 'protocol',
        tokens: [
          {
            address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
            name: 'Liquid staked Ether 2.0',
            symbol: 'stETH',
            decimals: 18,
            type: 'underlying',
            balanceRaw: '1000000000000000000',
            balance: 10,
            price: 2000,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
            tokens: [
              {
                address: '0x0000000000000000000000000000000000000000',
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18,
                type: 'underlying',
                balanceRaw: '1000000000000000000',
                balance: 10,
                price: 2000,
                iconUrl:
                  'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    protocolId: 'uniswap-v3-MOCK_DEFI_RESPONSE_COMPLEX',
    name: 'UniswapV3-MOCK_DEFI_RESPONSE_COMPLEX',
    description: 'UniswapV3 defi adapter',
    siteUrl: 'https://uniswap.org/',
    iconUrl:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
    positionType: 'supply',
    chainId: 59144,
    productId: 'pool',
    chainName: 'linea',
    success: true,
    tokens: [
      {
        address: '0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1',
        tokenId: '123456',
        name: 'USDC / AERO - 0.05%',
        symbol: 'USDC / AERO - 0.05%',
        decimals: 18,
        balanceRaw: '5000000000000000',
        balance: 0.005,
        type: 'protocol',
        tokens: [
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            balanceRaw: '300000000',
            type: 'underlying',
            balance: 300,
            price: 1,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png',
          },
          {
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            balanceRaw: '20000000',
            type: 'underlying-claimable',
            balance: 20,
            price: 1,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png',
          },
          {
            address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
            name: 'Aerodrome',
            symbol: 'AERO',
            decimals: 18,
            balanceRaw: '2000000000000000000000',
            type: 'underlying',
            balance: 2000,
            price: 0.5,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x940181a94A35A4569E4529A3CDfB74e38FD98631/logo.png',
          },
          {
            address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
            name: 'Aerodrome',
            symbol: 'AERO',
            decimals: 18,
            balanceRaw: '50000000000000000000',
            type: 'underlying-claimable',
            balance: 50,
            price: 0.5,
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x940181a94A35A4569E4529A3CDfB74e38FD98631/logo.png',
          },
        ],
      },
    ],
  },
];
