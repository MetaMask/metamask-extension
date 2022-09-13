import { MAINNET_CHAIN_ID } from '../../shared/constants/network';

const createGetSmartTransactionFeesApiResponse = () => {
  return {
    tradeTxFees: {
      // Approval tx.
      cancelFees: [
        { maxFeePerGas: 2100001000, maxPriorityFeePerGas: 466503987 },
        { maxFeePerGas: 2310003200, maxPriorityFeePerGas: 513154852 },
        { maxFeePerGas: 2541005830, maxPriorityFeePerGas: 564470851 },
        { maxFeePerGas: 2795108954, maxPriorityFeePerGas: 620918500 },
        { maxFeePerGas: 3074622644, maxPriorityFeePerGas: 683010971 },
        { maxFeePerGas: 3382087983, maxPriorityFeePerGas: 751312751 },
        { maxFeePerGas: 3720300164, maxPriorityFeePerGas: 826444778 },
        { maxFeePerGas: 4092333900, maxPriorityFeePerGas: 909090082 },
        { maxFeePerGas: 4501571383, maxPriorityFeePerGas: 1000000000 },
        { maxFeePerGas: 4951733023, maxPriorityFeePerGas: 1100001000 },
        { maxFeePerGas: 5446911277, maxPriorityFeePerGas: 1210002200 },
        { maxFeePerGas: 5991607851, maxPriorityFeePerGas: 1331003630 },
        { maxFeePerGas: 6590774628, maxPriorityFeePerGas: 1464105324 },
        { maxFeePerGas: 7249858682, maxPriorityFeePerGas: 1610517320 },
        { maxFeePerGas: 7974851800, maxPriorityFeePerGas: 1771570663 },
        { maxFeePerGas: 8772344955, maxPriorityFeePerGas: 1948729500 },
        { maxFeePerGas: 9649588222, maxPriorityFeePerGas: 2143604399 },
        { maxFeePerGas: 10614556694, maxPriorityFeePerGas: 2357966983 },
        { maxFeePerGas: 11676022978, maxPriorityFeePerGas: 2593766039 },
      ],
      feeEstimate: 42000000000000,
      fees: [
        { maxFeePerGas: 2310003200, maxPriorityFeePerGas: 513154852 },
        { maxFeePerGas: 2541005830, maxPriorityFeePerGas: 564470850 },
        { maxFeePerGas: 2795108954, maxPriorityFeePerGas: 620918500 },
        { maxFeePerGas: 3074622644, maxPriorityFeePerGas: 683010970 },
        { maxFeePerGas: 3382087983, maxPriorityFeePerGas: 751312751 },
        { maxFeePerGas: 3720300163, maxPriorityFeePerGas: 826444777 },
        { maxFeePerGas: 4092333900, maxPriorityFeePerGas: 909090082 },
        { maxFeePerGas: 4501571382, maxPriorityFeePerGas: 999999999 },
        { maxFeePerGas: 4951733022, maxPriorityFeePerGas: 1100001000 },
        { maxFeePerGas: 5446911277, maxPriorityFeePerGas: 1210002200 },
        { maxFeePerGas: 5991607851, maxPriorityFeePerGas: 1331003630 },
        { maxFeePerGas: 6590774627, maxPriorityFeePerGas: 1464105324 },
        { maxFeePerGas: 7249858681, maxPriorityFeePerGas: 1610517320 },
        { maxFeePerGas: 7974851800, maxPriorityFeePerGas: 1771570662 },
        { maxFeePerGas: 8772344954, maxPriorityFeePerGas: 1948729500 },
        { maxFeePerGas: 9649588222, maxPriorityFeePerGas: 2143604398 },
        { maxFeePerGas: 10614556693, maxPriorityFeePerGas: 2357966982 },
        { maxFeePerGas: 11676022977, maxPriorityFeePerGas: 2593766039 },
        { maxFeePerGas: 12843636951, maxPriorityFeePerGas: 2853145236 },
      ],
      gasLimit: 21000,
      gasUsed: 21000,
    },
    approvalTxFees: {
      // Trade tx.
      cancelFees: [
        { maxFeePerGas: 2100001000, maxPriorityFeePerGas: 466503987 },
        { maxFeePerGas: 2310003200, maxPriorityFeePerGas: 513154852 },
        { maxFeePerGas: 2541005830, maxPriorityFeePerGas: 564470851 },
        { maxFeePerGas: 2795108954, maxPriorityFeePerGas: 620918500 },
        { maxFeePerGas: 3074622644, maxPriorityFeePerGas: 683010971 },
        { maxFeePerGas: 3382087983, maxPriorityFeePerGas: 751312751 },
        { maxFeePerGas: 3720300164, maxPriorityFeePerGas: 826444778 },
        { maxFeePerGas: 4092333900, maxPriorityFeePerGas: 909090082 },
        { maxFeePerGas: 4501571383, maxPriorityFeePerGas: 1000000000 },
        { maxFeePerGas: 4951733023, maxPriorityFeePerGas: 1100001000 },
        { maxFeePerGas: 5446911277, maxPriorityFeePerGas: 1210002200 },
        { maxFeePerGas: 5991607851, maxPriorityFeePerGas: 1331003630 },
        { maxFeePerGas: 6590774628, maxPriorityFeePerGas: 1464105324 },
        { maxFeePerGas: 7249858682, maxPriorityFeePerGas: 1610517320 },
        { maxFeePerGas: 7974851800, maxPriorityFeePerGas: 1771570663 },
        { maxFeePerGas: 8772344955, maxPriorityFeePerGas: 1948729500 },
        { maxFeePerGas: 9649588222, maxPriorityFeePerGas: 2143604399 },
        { maxFeePerGas: 10614556694, maxPriorityFeePerGas: 2357966983 },
        { maxFeePerGas: 11676022978, maxPriorityFeePerGas: 2593766039 },
      ],
      feeEstimate: 42000000000000,
      fees: [
        { maxFeePerGas: 2310003200, maxPriorityFeePerGas: 513154852 },
        { maxFeePerGas: 2541005830, maxPriorityFeePerGas: 564470850 },
        { maxFeePerGas: 2795108954, maxPriorityFeePerGas: 620918500 },
        { maxFeePerGas: 3074622644, maxPriorityFeePerGas: 683010970 },
        { maxFeePerGas: 3382087983, maxPriorityFeePerGas: 751312751 },
        { maxFeePerGas: 3720300163, maxPriorityFeePerGas: 826444777 },
        { maxFeePerGas: 4092333900, maxPriorityFeePerGas: 909090082 },
        { maxFeePerGas: 4501571382, maxPriorityFeePerGas: 999999999 },
        { maxFeePerGas: 4951733022, maxPriorityFeePerGas: 1100001000 },
        { maxFeePerGas: 5446911277, maxPriorityFeePerGas: 1210002200 },
        { maxFeePerGas: 5991607851, maxPriorityFeePerGas: 1331003630 },
        { maxFeePerGas: 6590774627, maxPriorityFeePerGas: 1464105324 },
        { maxFeePerGas: 7249858681, maxPriorityFeePerGas: 1610517320 },
        { maxFeePerGas: 7974851800, maxPriorityFeePerGas: 1771570662 },
        { maxFeePerGas: 8772344954, maxPriorityFeePerGas: 1948729500 },
        { maxFeePerGas: 9649588222, maxPriorityFeePerGas: 2143604398 },
        { maxFeePerGas: 10614556693, maxPriorityFeePerGas: 2357966982 },
        { maxFeePerGas: 11676022977, maxPriorityFeePerGas: 2593766039 },
        { maxFeePerGas: 12843636951, maxPriorityFeePerGas: 2853145236 },
      ],
      gasLimit: 21000,
      gasUsed: 21000,
    },
  };
};

export const createSwapsMockStore = () => {
  return {
    swaps: {
      customGas: {
        limit: '0x0',
        fallBackPrice: 5,
        priceEstimates: {
          blockTime: 14.1,
          safeLow: 2.5,
          safeLowWait: 6.6,
          average: 4,
          avgWait: 5.3,
          fast: 5,
          fastWait: 3.3,
          fastest: 10,
          fastestWait: 0.5,
        },
      },
      fromToken: 'ETH',
    },
    metamask: {
      networkDetails: {
        EIPS: {
          1559: false,
        },
      },
      provider: {
        chainId: MAINNET_CHAIN_ID,
      },
      cachedBalances: {
        [MAINNET_CHAIN_ID]: 5,
      },
      preferences: {
        showFiatInTestnets: true,
      },
      currentCurrency: 'ETH',
      conversionRate: 1,
      contractExchangeRates: {
        '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 2,
        '0x1111111111111111111111111111111111111111': 0.1,
      },
      identities: {
        '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825': {
          address: '0xfdea65c8e26263f6d9a1b5de9555d2931a33b825',
          name: 'Send Account 1',
        },
        '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb': {
          address: '0xc5b8dbac4c1d3f152cdeb400e2313f309c410acb',
          name: 'Send Account 2',
        },
        '0x2f8d4a878cfa04a6e60d46362f5644deab66572d': {
          address: '0x2f8d4a878cfa04a6e60d46362f5644deab66572d',
          name: 'Send Account 3',
        },
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          name: 'Send Account 4',
        },
      },
      accounts: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          balance: '0x0',
        },
        '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
          address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
          balance: '0x0',
        },
      },
      selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      keyringTypes: ['Simple Key Pair', 'HD Key Tree'],
      keyrings: [
        {
          type: 'HD Key Tree',
          accounts: [
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            'c5b8dbac4c1d3f152cdeb400e2313f309c410acb',
            '2f8d4a878cfa04a6e60d46362f5644deab66572d',
          ],
        },
        {
          type: 'Simple Key Pair',
          accounts: ['0xd85a4b6a394794842887b8284293d69163007bbb'],
        },
      ],
      frequentRpcListDetail: [],
      tokens: [
        {
          erc20: true,
          symbol: 'BAT',
          decimals: 18,
          address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
        },
        {
          erc20: true,
          symbol: 'USDT',
          decimals: 6,
          address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        },
      ],
      swapsState: {
        swapsFeatureFlags: {
          smartTransactions: {
            mobileActive: true,
            extensionActive: true,
          },
        },
        quotes: {
          TEST_AGG_1: {
            trade: {
              from: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
              value: '0x0',
              gas: '0x61a80', // 4e5
              to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
            },
            sourceAmount: '10000000000000000000', // 10e18
            destinationAmount: '20000000000000000000', // 20e18
            error: null,
            sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
            destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            approvalNeeded: null,
            maxGas: 600000,
            averageGas: 120000,
            estimatedRefund: 80000,
            fetchTime: 607,
            aggregator: 'TEST_AGG_1',
            aggType: 'AGG',
            slippage: 2,
            sourceTokenInfo: {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              symbol: 'DAI',
              decimals: 18,
              iconUrl: 'https://foo.bar/logo.png',
            },
            destinationTokenInfo: {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 18,
            },
            fee: 1,
          },

          TEST_AGG_BEST: {
            trade: {
              from: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
              value: '0x0',
              gas: '0x61a80',
              to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
            },
            sourceAmount: '10000000000000000000',
            destinationAmount: '25000000000000000000', // 25e18
            error: null,
            sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
            destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            approvalNeeded: null,
            maxGas: 1100000,
            averageGas: 411000,
            estimatedRefund: 343090,
            fetchTime: 1003,
            aggregator: 'TEST_AGG_BEST',
            aggType: 'AGG',
            slippage: 2,
            sourceTokenInfo: {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              symbol: 'DAI',
              decimals: 18,
              iconUrl: 'https://foo.bar/logo.png',
            },
            destinationTokenInfo: {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 18,
            },
            fee: 1,
          },
          TEST_AGG_2: {
            trade: {
              from: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
              value: '0x0',
              gas: '0x61a80',
              to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
            },
            sourceAmount: '10000000000000000000',
            destinationAmount: '22000000000000000000', // 22e18
            error: null,
            sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
            destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            approvalNeeded: null,
            maxGas: 368000,
            averageGas: 197000,
            estimatedRefund: 18205,
            fetchTime: 1354,
            aggregator: 'TEST_AGG_2',
            aggType: 'AGG',
            isBestQuote: true,
            slippage: 2,
            sourceTokenInfo: {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              symbol: 'DAI',
              decimals: 18,
              iconUrl: 'https://foo.bar/logo.png',
            },
            destinationTokenInfo: {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 18,
            },
            fee: 1,
          },
        },
        fetchParams: {
          metaData: {
            sourceTokenInfo: {
              symbol: 'BAT',
            },
            destinationTokenInfo: {
              symbol: 'ETH',
            },
          },
        },
        tradeTxId: null,
        approveTxId: null,
        quotesLastFetched: 1519211809934,
        swapsQuoteRefreshTime: 60000,
        swapsQuotePrefetchingRefreshTime: 60000,
        customMaxGas: '',
        customGasPrice: null,
        selectedAggId: 'TEST_AGG_2',
        customApproveTxData: '',
        errorKey: '',
        topAggId: 'TEST_AGG_BEST',
        routeState: '',
        swapsFeatureIsLive: false,
      },
      useTokenDetection: true,
      tokenList: {
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'UNI',
          decimals: 18,
          name: 'Uniswap',
          iconUrl: '',
          aggregators: [
            'airswapLight',
            'bancor',
            'cmc',
            'coinGecko',
            'kleros',
            'oneInch',
            'paraswap',
            'pmm',
            'totle',
            'zapper',
            'zerion',
            'zeroEx',
          ],
          occurrences: 12,
        },
        '0x514910771af9ca656af840dff83e8264ecf986ca': {
          address: '0x514910771af9ca656af840dff83e8264ecf986ca',
          symbol: 'LINK',
          decimals: 18,
          name: 'Chainlink',
          iconUrl: '',
          aggregators: [
            'airswapLight',
            'bancor',
            'cmc',
            'coinGecko',
            'kleros',
            'oneInch',
            'paraswap',
            'pmm',
            'totle',
            'zapper',
            'zerion',
            'zeroEx',
          ],
          occurrences: 12,
        },
        '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2': {
          address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
          symbol: 'SUSHI',
          decimals: 18,
          name: 'SushiSwap',
          iconUrl: '',
          aggregators: [
            'bancor',
            'cmc',
            'coinGecko',
            'kleros',
            'oneInch',
            'paraswap',
            'pmm',
            'totle',
            'zapper',
            'zerion',
            'zeroEx',
          ],
          occurrences: 11,
        },
      },
      smartTransactionsState: {
        userOptIn: true,
        liveness: true,
        fees: createGetSmartTransactionFeesApiResponse(),
        smartTransactions: {
          [MAINNET_CHAIN_ID]: [
            {
              uuid: 'uuid2',
              status: 'success',
              statusMetadata: {
                cancellationFeeWei: 36777567771000,
                cancellationReason: 'not_cancelled',
                deadlineRatio: 0.6400288486480713,
                minedHash:
                  '0x55ad39634ee10d417b6e190cfd3736098957e958879cffe78f1f00f4fd2654d6',
                minedTx: 'success',
              },
            },
            {
              uuid: 'uuid2',
              status: 'pending',
              statusMetadata: {
                cancellationFeeWei: 36777567771000,
                cancellationReason: 'not_cancelled',
                deadlineRatio: 0.6400288486480713,
                minedHash:
                  '0x55ad39634ee10d417b6e190cfd3736098957e958879cffe78f1f00f4fd2654d6',
                minedTx: 'success',
              },
            },
          ],
        },
      },
    },
    appState: {
      modal: {
        open: true,
        modalState: {
          name: 'test',
          props: {
            initialGasLimit: 100,
            minimumGasLimit: 5,
          },
        },
      },
      gasLoadingAnimationIsShowing: false,
    },
  };
};
