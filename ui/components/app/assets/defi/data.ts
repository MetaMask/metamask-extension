export const data = {
  '0x1': {
    aggregatedMarketValue: 20540,
    protocols: {
      'aave-v3': {
        protocolDetails: {
          name: 'AaveV3',
          iconUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
        },
        aggregatedMarketValue: 540,
        positionTypes: {
          supply: {
            aggregatedMarketValue: 1540,
            positions: [
              [
                {
                  address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
                  name: 'Aave Ethereum WETH',
                  symbol: 'aEthWETH',
                  decimals: 18,
                  balanceRaw: '40000000000000000',
                  balance: 0.04,
                  marketValue: 40,
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
                      marketValue: 40,
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
                  marketValue: 1500,
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
                      marketValue: 1500,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
                    },
                  ],
                },
              ],
            ],
          },
          borrow: {
            aggregatedMarketValue: 1000,
            positions: [
              [
                {
                  address: '0x6df1C1E379bC5a00a7b4C6e67A203333772f45A8',
                  name: 'Aave Ethereum Variable Debt USDT',
                  symbol: 'variableDebtEthUSDT',
                  decimals: 6,
                  balanceRaw: '1000000000',
                  marketValue: 1000,
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
                      marketValue: 1000,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                    },
                  ],
                  balance: 1000,
                },
              ],
            ],
          },
        },
      },
      lido: {
        protocolDetails: {
          name: 'Lido',
          iconUrl:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
        },
        aggregatedMarketValue: 20000,
        positionTypes: {
          stake: {
            aggregatedMarketValue: 20000,
            positions: [
              [
                {
                  address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
                  name: 'Wrapped liquid staked Ether 2.0',
                  symbol: 'wstETH',
                  decimals: 18,
                  balanceRaw: '800000000000000000000',
                  balance: 800,
                  marketValue: 20000,
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
                      marketValue: 20000,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
                    },
                  ],
                },
              ],
            ],
          },
        },
      },
    },
  },
  '0x2105': {
    aggregatedMarketValue: 9580,
    protocols: {
      'uniswap-v3': {
        protocolDetails: {
          name: 'UniswapV3',
          iconUrl:
            'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png',
        },
        aggregatedMarketValue: 9580,
        positionTypes: {
          supply: {
            aggregatedMarketValue: 9580,
            positions: [
              [
                {
                  address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                  tokenId: '940758',
                  name: 'GASP / USDT - 0.3%',
                  symbol: 'GASP / USDT - 0.3%',
                  decimals: 18,
                  balanceRaw: '1000000000000000000',
                  balance: 1,
                  marketValue: 513,
                  type: 'protocol',
                  tokens: [
                    {
                      address: '0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E',
                      name: 'GASP',
                      symbol: 'GASP',
                      decimals: 18,
                      balanceRaw: '100000000000000000000',
                      type: 'underlying',
                      balance: 100,
                      price: 0.1,
                      marketValue: 10,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E/logo.png',
                    },
                    {
                      address: '0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E',
                      name: 'GASP',
                      symbol: 'GASP',
                      decimals: 18,
                      balanceRaw: '10000000000000000000',
                      type: 'underlying-claimable',
                      balance: 10,
                      price: 0.1,
                      marketValue: 1,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E/logo.png',
                    },
                    {
                      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                      name: 'Tether USD',
                      symbol: 'USDT',
                      decimals: 6,
                      balanceRaw: '500000000',
                      type: 'underlying',
                      balance: 500,
                      price: 1,
                      marketValue: 500,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                    },
                    {
                      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                      name: 'Tether USD',
                      symbol: 'USDT',
                      decimals: 6,
                      balanceRaw: '2000000',
                      type: 'underlying-claimable',
                      balance: 2,
                      price: 1,
                      marketValue: 2,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                    },
                  ],
                },
              ],
              [
                {
                  address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
                  tokenId: '940760',
                  name: 'GASP / USDT - 0.3%',
                  symbol: 'GASP / USDT - 0.3%',
                  decimals: 18,
                  balanceRaw: '2000000000000000000',
                  balance: 2,
                  marketValue: 9067,
                  type: 'protocol',
                  tokens: [
                    {
                      address: '0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E',
                      name: 'GASP',
                      symbol: 'GASP',
                      decimals: 18,
                      balanceRaw: '90000000000000000000000',
                      type: 'underlying',
                      balance: 90000,
                      price: 0.1,
                      marketValue: 9000,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E/logo.png',
                    },
                    {
                      address: '0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E',
                      name: 'GASP',
                      symbol: 'GASP',
                      decimals: 18,
                      balanceRaw: '50000000000000000000',
                      type: 'underlying-claimable',
                      balance: 50,
                      price: 0.1,
                      marketValue: 5,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x736ECc5237B31eDec6f1aB9a396FaE2416b1d96E/logo.png',
                    },
                    {
                      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                      name: 'Tether USD',
                      symbol: 'USDT',
                      decimals: 6,
                      balanceRaw: '60000000',
                      type: 'underlying',
                      balance: 60,
                      price: 1,
                      marketValue: 60,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                    },
                    {
                      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                      name: 'Tether USD',
                      symbol: 'USDT',
                      decimals: 6,
                      balanceRaw: '2000000',
                      type: 'underlying-claimable',
                      balance: 2,
                      price: 1,
                      marketValue: 2,
                      iconUrl:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
                    },
                  ],
                },
              ],
            ],
          },
        },
      },
    },
  },
};