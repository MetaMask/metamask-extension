import { migrate } from './174';

const oldVersion = 173;
const newVersion = 174;

const evmTxHistoryItem = {
  account: '0x30e8ccad5a980bdf30447f8c2c48e70989d9d294',
  completionTime: 1751551808139,
  estimatedProcessingTimeInSeconds: 40,
  hasApprovalTx: false,
  isStxEnabled: false,
  pricingData: {
    amountSent: '20',
    amountSentInUsd: '3.808',
    quotedGasInUsd: '0.0037084475336301667456',
    quotedReturnInUsd: '3.71893943991034655058',
  },
  quote: {
    aggregator: 'lifi',
    bridgeId: 'lifi',
    bridges: ['mayan (via LiFi)'],
    destAsset: {
      address: '0x0000000000000000000000000000000000000000',
      aggregators: [],
      assetId: 'eip155:8453/slip44:8453',
      chainId: 8453,
      coingeckoId: 'base',
      decimals: 18,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/8453/slip44/8453.png',
      metadata: {
        createdAt: '2023-10-31T21:47:47.414Z',
        erc20Permit: false,
        honeypotStatus: {},
      },
      name: 'Ether',
      occurrences: 100,
      price: '2623.34844901',
      symbol: 'ETH',
    },
    destChainId: 8453,
    destTokenAmount: '1416301803980618',
    feeData: {
      metabridge: {
        amount: '175000000000000000',
        asset: {
          address: '0x0000000000000000000000000000000000000000',
          aggregators: [],
          assetId: 'eip155:137/slip44:966',
          chainId: 137,
          coingeckoId: 'matic-network',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/slip44/966.png',
          metadata: {
            createdAt: '2023-11-01T15:37:16.456Z',
            erc20Permit: false,
            honeypotStatus: {},
          },
          name: 'Polygon Ecosystem Token',
          occurrences: 100,
          price: '0.18965',
          symbol: 'POL',
        },
      },
    },
    priceData: {
      priceImpact: '0.024074268827795352',
      totalFromAmountUsd: '3.81332',
      totalToAmountUsd: '3.7215171091935915',
    },
    protocols: ['mayan (via LiFi)'],
    requestId:
      '0x4d0b113f4093068b29bb04706d9a5bb7932317a5beba3edd115ede8722d84569',
    srcAsset: {
      address: '0x0000000000000000000000000000000000000000',
      aggregators: [],
      assetId: 'eip155:137/slip44:966',
      chainId: 137,
      coingeckoId: 'matic-network',
      decimals: 18,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/slip44/966.png',
      metadata: {
        createdAt: '2023-11-01T15:37:16.456Z',
        erc20Permit: false,
        honeypotStatus: {},
      },
      name: 'Polygon Ecosystem Token',
      occurrences: 100,
      price: '0.18965',
      symbol: 'POL',
    },
    srcChainId: 137,
    srcTokenAmount: '19825000000000000000',
    steps: [
      {
        action: 'swap',
        destAmount: '3774534',
        destAsset: {
          address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
          aggregators: [
            'coinGecko',
            'uniswapLabs',
            'oneInch',
            'liFi',
            'socket',
            'rubic',
            'squid',
            'rango',
            'sonarwatch',
            'sushiSwap',
          ],
          assetId:
            'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          chainId: 137,
          coingeckoId: 'usd-coin',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/erc20/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.png',
          metadata: {
            storage: {
              approval: 10,
              balance: 9,
            },
          },
          name: 'USDC',
          occurrences: 10,
          symbol: 'USDC',
        },
        destChainId: 137,
        protocol: {
          displayName: 'Velora',
          icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/exchanges/velora.svg',
          name: 'paraswap',
        },
        srcAmount: '19825000000000000000',
        srcAsset: {
          address: '0x0000000000000000000000000000000000000000',
          aggregators: [],
          assetId: 'eip155:137/slip44:966',
          chainId: 137,
          coingeckoId: 'matic-network',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/slip44/966.png',
          metadata: {
            createdAt: '2023-11-01T15:37:16.456Z',
            erc20Permit: false,
            honeypotStatus: {},
          },
          name: 'Polygon Ecosystem Token',
          occurrences: 100,
          symbol: 'POL',
        },
        srcChainId: 137,
      },
      {
        action: 'bridge',
        destAmount: '1416301803980618',
        destAsset: {
          address: '0x0000000000000000000000000000000000000000',
          aggregators: [],
          assetId: 'eip155:8453/slip44:8453',
          chainId: 8453,
          coingeckoId: 'base',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/8453/slip44/8453.png',
          metadata: {
            createdAt: '2023-10-31T21:47:47.414Z',
            erc20Permit: false,
            honeypotStatus: {},
          },
          name: 'Ether',
          occurrences: 100,
          symbol: 'ETH',
        },
        destChainId: 8453,
        protocol: {
          displayName: 'Mayan (Swift)',
          icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/mayan.svg',
          name: 'mayan',
        },
        srcAmount: '3774534',
        srcAsset: {
          address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
          aggregators: [
            'coinGecko',
            'uniswapLabs',
            'oneInch',
            'liFi',
            'socket',
            'rubic',
            'squid',
            'rango',
            'sonarwatch',
            'sushiSwap',
          ],
          assetId:
            'eip155:137/erc20:0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          chainId: 137,
          coingeckoId: 'usd-coin',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/erc20/0x3c499c542cef5e3811e1192ce70d8cc03d5c3359.png',
          metadata: {
            storage: {
              approval: 10,
              balance: 9,
            },
          },
          name: 'USDC',
          occurrences: 10,
          symbol: 'USDC',
        },
        srcChainId: 137,
      },
    ],
  },
  slippagePercentage: 0,
  startTime: 1751551751310,
  status: {
    bridge: 'mayan',
    destChain: {
      amount: '1418075084201783',
      chainId: 8453,
      token: {
        address: '0x0000000000000000000000000000000000000000',
        aggregators: [],
        assetId: 'eip155:8453/slip44:8453',
        chainId: 8453,
        coingeckoId: 'base',
        decimals: 18,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/8453/slip44/8453.png',
        metadata: {
          createdAt: '2023-10-31T21:47:47.414Z',
          erc20Permit: false,
          honeypotStatus: {},
        },
        name: 'Ether',
        occurrences: 100,
        symbol: 'ETH',
      },
      txHash:
        '0x9b5e0b4938b7e9e33bfb32669c3c9b1f8faec14cd1c38664a07d06ba84dd4f9d',
    },
    isExpectedToken: true,
    srcChain: {
      amount: '19825000000000000000',
      chainId: 137,
      token: {
        address: '0x0000000000000000000000000000000000000000',
        aggregators: [],
        assetId: 'eip155:137/slip44:966',
        chainId: 137,
        coingeckoId: 'matic-network',
        decimals: 18,
        iconUrl:
          'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/137/slip44/966.png',
        metadata: {
          createdAt: '2023-11-01T15:37:16.456Z',
          erc20Permit: false,
          honeypotStatus: {},
        },
        name: 'Polygon Ecosystem Token',
        occurrences: 100,
        symbol: 'POL',
      },
      txHash:
        '0x259cd14082c3317f243ba96401f04484805def573b7a8e12f1526ee9b9e36750',
    },
    status: 'COMPLETE',
  },
  txMetaId: '4ad572c0-5817-11f0-9a9f-65cbc1ba7703',
};

const solanaTxHistoryItem = {
  account: '8jKM7u4xsyvDpnqL5DQMVrh8AXxZKJPKJw5QsM7KEF8J',
  estimatedProcessingTimeInSeconds: 0,
  hasApprovalTx: false,
  isStxEnabled: false,
  pricingData: {
    amountSent: '2.126404',
    amountSentInUsd: '2.126136073096',
    quotedGasInUsd: '0.00131889037',
    quotedReturnInUsd: '1.98572611132',
  },
  quote: {
    aggregator: 'squid',
    bridgeId: 'squid',
    bridges: ['Meteora DLMM'],
    destAsset: {
      address: '0x0000000000000000000000000000000000000000',
      aggregators: [],
      assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
      chainId: 1151111081099710,
      decimals: 9,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
      metadata: {},
      name: 'SOL',
      occurrences: 100,
      price: '138.767357481',
      symbol: 'SOL',
    },
    destChainId: 1151111081099710,
    destTokenAmount: '14319796',
    feeData: {
      metabridge: {
        amount: '126404',
        asset: {
          address: '0x0000000000000000000000000000000000000000',
          aggregators: [],
          assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
          chainId: 1151111081099710,
          decimals: 9,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
          metadata: {},
          name: 'SOL',
          occurrences: 100,
          symbol: 'SOL',
        },
      },
    },
    priceData: {
      priceImpact: '0.0070118278303067764',
      totalFromAmountUsd: '1.999748',
      totalToAmountUsd: '1.9857261113199998',
    },
    protocols: ['Meteora DLMM'],
    requestId: 'c23cb1e042fc31969c25d239b6d438d0',
    srcAsset: {
      address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
      assetId:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      chainId: 1151111081099710,
      coingeckoId: 'usd-coin',
      decimals: 6,
      iconUrl:
        'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
      metadata: {},
      name: 'USD Coin',
      occurrences: 4,
      price: '0.99992823',
      symbol: 'USDC',
    },
    srcChainId: 1151111081099710,
    srcTokenAmount: '2000000',
    steps: [
      {
        action: 'swap',
        destAmount: '14446200',
        destAsset: {
          address: 'So11111111111111111111111111111111111111112',
          aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
          assetId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:So11111111111111111111111111111111111111112',
          chainId: 1151111081099710,
          coingeckoId: 'wrapped-solana',
          decimals: 9,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/So11111111111111111111111111111111111111112.png',
          metadata: {},
          name: 'wSOL',
          occurrences: 4,
          symbol: 'wSOL',
        },
        destChainId: 1151111081099710,
        protocol: {
          displayName: 'Meteora DLMM',
          name: 'Meteora DLMM',
        },
        srcAmount: '2000000',
        srcAsset: {
          address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          aggregators: ['orca', 'jupiter', 'coinGecko', 'lifi'],
          assetId:
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          chainId: 1151111081099710,
          coingeckoId: 'usd-coin',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
          metadata: {},
          name: 'USD Coin',
          occurrences: 4,
          symbol: 'USDC',
        },
        srcChainId: 1151111081099710,
      },
    ],
  },
  slippagePercentage: 0,
  startTime: 1750706072849,
  status: {
    srcChain: {
      chainId: 1151111081099710,
      txHash:
        '5Cs9btTX3G7a4H4mmbuYLPpEzyyj2t64aSnCCMyy1AKQZvBrLprbmcT7TF2mcTQNKGik9JTLRkqHTtkKjHUUi4af',
    },
    status: 'PENDING',
  },
  txMetaId: '4731011b-c021-46c8-9dbd-706d21ef6709',
};

describe(`migration #${newVersion}`, () => {
  beforeEach(() => {
    // Mock global.sentry for tests
    global.sentry = {
      captureException: jest.fn(),
    };
  });

  afterEach(() => {
    // Clean up the mock
    delete global.sentry;
  });

  describe('when txHistory exists and has data', () => {
    it('should update txHistory keys for solana txs and preserve other txs', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          BridgeStatusController: {
            txHistory: {
              '4ad572c0-5817-11f0-9a9f-65cbc1ba7703': evmTxHistoryItem,
              '4731011b-c021-46c8-9dbd-706d21ef6709': solanaTxHistoryItem,
            },
          },
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data.BridgeStatusController).toStrictEqual({
        txHistory: {
          '4ad572c0-5817-11f0-9a9f-65cbc1ba7703': evmTxHistoryItem,
          '5Cs9btTX3G7a4H4mmbuYLPpEzyyj2t64aSnCCMyy1AKQZvBrLprbmcT7TF2mcTQNKGik9JTLRkqHTtkKjHUUi4af':
            {
              ...solanaTxHistoryItem,
              txMetaId:
                '5Cs9btTX3G7a4H4mmbuYLPpEzyyj2t64aSnCCMyy1AKQZvBrLprbmcT7TF2mcTQNKGik9JTLRkqHTtkKjHUUi4af',
            },
        },
      });

      const {
        // eslint-disable-next-line no-unused-vars
        data: { BridgeStatusController: _, ...otherOldStates },
      } = oldState;
      const {
        // eslint-disable-next-line no-unused-vars
        data: {
          BridgeStatusController: bridgeStatusControllerState,
          ...otherStates
        },
        meta,
      } = newState;
      expect(otherStates).toStrictEqual(otherOldStates);
      expect(meta).toStrictEqual({ version: newVersion });
    });
  });

  describe('when txHistory does not exist', () => {
    it('should not update state', async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: {
          BridgeStatusController: {},
        },
      };

      const newState = await migrate(oldState);

      expect(newState.data).toStrictEqual(oldState.data);
    });
  });

  [
    undefined,
    null,
    {},
    { BridgeStatusController: {} },
    { BridgeStatusController: null },
    { BridgeStatusController: 'abc' },
    { BridgeStatusController: { txHistory: {} } },
    { BridgeStatusController: { txHistory: null } },
    { BridgeStatusController: { txHistory: 'abc' } },
  ].forEach((bridgeStatusControllerState) => {
    it(`does not change the state if BridgeStatusController state is ${bridgeStatusControllerState?.toString()}`, async () => {
      const oldState = {
        meta: {
          version: oldVersion,
        },
        data: bridgeStatusControllerState,
      };

      const newState = await migrate(oldState as never);

      expect(newState.data).toStrictEqual(oldState.data);
      expect(global.sentry.captureException).toHaveBeenCalledTimes(0);
    });
  });

  it('captures an exception if an error occurs', async () => {
    const oldState = {
      meta: {
        version: oldVersion,
      },
      data: {
        BridgeStatusController: {
          txHistory: {
            '4ad572c0-5817-11f0-9a9f-65cbc1ba7703': evmTxHistoryItem,
            '4731011b-c021-46c8-9dbd-706d21ef6709': {
              ...solanaTxHistoryItem,
              status: { srcChain: { txHash: {} } },
            },
          },
        },
      },
    };

    const newState = await migrate(oldState as never);

    expect(newState.data).toStrictEqual(oldState.data);
    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${newVersion}: Failed to update bridge txHistory for solana to use txHash as key and txMetaId. Error: TypeError: Cannot read properties of undefined (reading 'toString')`,
      ),
    );
  });
});
