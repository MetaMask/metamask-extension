import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { EthAccountType } from '@metamask/keyring-api';
import type { CaipChainId } from '@metamask/utils';
import { setGlobalDevModeChecks } from 'reselect';
import { BATCH_SELL_ASSET_IDS } from '../../../test/data/batch-sell';
import {
  getAssetsBySelectedAccountGroup,
  getAssetsRates,
} from '../../selectors/assets';
import {
  getAllMultichainNetworkConfigurations,
  getMarketData,
} from '../../selectors';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getBridgeFeatureFlags } from '../bridge/selectors';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { getBridgeAssetsByAssetId } from '../bridge/asset-selectors';
import {
  getAvailableBatchSellNetworks,
  getAvailableBatchSellReceiveAssetsForNetwork,
  getBatchSellDestStablecoinsForNetwork,
  getAvailableBatchSellSwapAssetsForNetwork,
} from './selectors';

jest.mock('../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
  getAssetsRates: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getAllMultichainNetworkConfigurations: jest.fn(),
  getMarketData: jest.fn(),
}));

jest.mock('../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../bridge/selectors', () => ({
  getBridgeFeatureFlags: jest.fn(),
  getPriceImpactThresholds: jest.fn(),
  computeQuoteValidationErrors: jest.fn(),
}));

jest.mock('../bridge/asset-selectors', () => ({
  getBridgeAssetsByAssetId: jest.fn(),
}));

jest.mock('../../selectors/multichain-accounts/account-tree', () => ({
  getSelectedAccountGroup: jest.fn().mockReturnValue(undefined),
}));

const mockGetAllMultichainNetworkConfigurations = jest.mocked(
  getAllMultichainNetworkConfigurations,
);
const mockGetSelectedInternalAccount = jest.mocked(getSelectedInternalAccount);
const mockGetAssetsBySelectedAccountGroup = jest.mocked(
  getAssetsBySelectedAccountGroup,
);
const mockGetAssetsRates = jest.mocked(getAssetsRates);
const mockGetMarketData = jest.mocked(getMarketData);
const mockGetBridgeFeatureFlags = jest.mocked(getBridgeFeatureFlags);
const mockGetBridgeAssetsByAssetId = jest.mocked(getBridgeAssetsByAssetId);

const CAIP_MAINNET = toEvmCaipChainId(CHAIN_IDS.MAINNET) as CaipChainId;
const CAIP_BASE = toEvmCaipChainId(CHAIN_IDS.BASE) as CaipChainId;
const CAIP_BSC = toEvmCaipChainId(CHAIN_IDS.BSC) as CaipChainId;
const CAIP_ARBITRUM = toEvmCaipChainId(CHAIN_IDS.ARBITRUM) as CaipChainId;
const CAIP_POLYGON = toEvmCaipChainId(CHAIN_IDS.POLYGON) as CaipChainId;
const CAIP_LINEA = toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET) as CaipChainId;
// Optimism is not in BATCH_SELL_SUPPORTED_CHAIN_IDS
const CAIP_OPTIMISM = 'eip155:10' as CaipChainId;

// Minimal EVM account accepted by isEvmAccountType
const MOCK_EVM_ACCOUNT = {
  id: 'evm-account-1',
  address: '0x1234',
  type: EthAccountType.Eoa,
  scopes: [] as CaipChainId[],
  options: {},
  metadata: { name: 'Test', keyring: { type: 'HD Key Tree' } },
  methods: [],
};

// Minimal Solana (non-EVM) account
const MOCK_SOLANA_ACCOUNT = {
  id: 'sol-account-1',
  address: 'SolanaAddress',
  type: 'solana:data-account' as const,
  scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'] as CaipChainId[],
  options: {},
  metadata: { name: 'Solana', keyring: { type: 'Snap Keyring' } },
  methods: [],
};

// Minimal network configuration – cast to unknown to avoid satisfying the full
// MultichainNetworkConfiguration type in test fixtures (isEvm, etc.)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNetwork = any;

const MOCK_MAINNET_NETWORK: AnyNetwork = {
  chainId: CAIP_MAINNET,
  name: 'Ethereum Mainnet',
  nativeCurrency: 'ETH',
  rpcEndpoints: [],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: [],
  defaultBlockExplorerUrlIndex: 0,
};

const MOCK_BASE_NETWORK: AnyNetwork = {
  chainId: CAIP_BASE,
  name: 'Base',
  nativeCurrency: 'ETH',
  rpcEndpoints: [],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: [],
  defaultBlockExplorerUrlIndex: 0,
};

const MOCK_OPTIMISM_NETWORK: AnyNetwork = {
  chainId: CAIP_OPTIMISM,
  name: 'Optimism',
  nativeCurrency: 'ETH',
  rpcEndpoints: [],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: [],
  defaultBlockExplorerUrlIndex: 0,
};

const MOCK_SOLANA_NETWORK: AnyNetwork = {
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId,
  name: 'Solana',
  nativeCurrency: 'SOL',
  rpcEndpoints: [],
  defaultRpcEndpointIndex: 0,
  blockExplorerUrls: [],
  defaultBlockExplorerUrlIndex: 0,
};

const ALL_NETWORKS: AnyNetwork = {
  [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
  [CAIP_BASE]: MOCK_BASE_NETWORK,
  [CAIP_OPTIMISM]: MOCK_OPTIMISM_NETWORK,
  [MOCK_SOLANA_NETWORK.chainId]: MOCK_SOLANA_NETWORK,
};

/** Return a fresh state object each call so reselect never returns a cached value. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const buildState = (): any => ({});

describe('batch-sell selectors', () => {
  beforeAll(() => {
    // Disable reselect's input-stability check so tests can freely use plain mock objects.
    setGlobalDevModeChecks({ inputStabilityCheck: 'never' });
  });

  afterAll(() => {
    setGlobalDevModeChecks({ inputStabilityCheck: 'once' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Non-stablecoin, eligible holding used to satisfy the "network must have
  // at least one sellable asset" requirement in the tests below.
  const eligibleHolding = (chainId: CaipChainId, assetSuffix: string) => ({
    assetId: `${chainId}/erc20:0x${assetSuffix.padStart(40, '0')}`,
    chainId,
    symbol: 'TOK',
    name: 'Test Token',
    decimals: 18,
    balance: '1',
  });

  describe('getAvailableBatchSellNetworksSelector', () => {
    beforeEach(() => {
      // Provide at least one stablecoin for every supported chain so the
      // stablecoin-presence filter does not strip them in the base cases.
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [
              'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            ],
          },
          [CAIP_BASE]: {
            batchSellDestStablecoins: [
              'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            ],
          },
          [CAIP_BSC]: {
            batchSellDestStablecoins: [
              'eip155:56/erc20:0x55d398326f99059fF775485246999027B3197955',
            ],
          },
          [CAIP_ARBITRUM]: {
            batchSellDestStablecoins: [
              'eip155:42161/erc20:0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            ],
          },
          [CAIP_POLYGON]: {
            batchSellDestStablecoins: [
              'eip155:137/erc20:0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            ],
          },
          [CAIP_LINEA]: {
            batchSellDestStablecoins: [
              'eip155:59144/erc20:0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
            ],
          },
        },
      } as never);
      // Default: every supported chain has an eligible, non-stablecoin
      // holding, so the "has sellable assets" filter does not strip a
      // network unless a test explicitly overrides this mock.
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [CAIP_MAINNET]: eligibleHolding(CAIP_MAINNET, '1'),
        [CAIP_BASE]: eligibleHolding(CAIP_BASE, '2'),
        [CAIP_BSC]: eligibleHolding(CAIP_BSC, '3'),
        [CAIP_ARBITRUM]: eligibleHolding(CAIP_ARBITRUM, '4'),
        [CAIP_POLYGON]: eligibleHolding(CAIP_POLYGON, '5'),
        [CAIP_LINEA]: eligibleHolding(CAIP_LINEA, '6'),
      } as never);
    });

    it('returns supported networks with positive balance, sorted by fiat balance descending', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
        [CAIP_BASE]: MOCK_BASE_NETWORK,
        [CAIP_OPTIMISM]: MOCK_OPTIMISM_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1', fiat: { balance: 500 } }],
        [CHAIN_IDS.BASE]: [{ rawBalance: '0x1', fiat: { balance: 1000 } }],
        '0xa': [{ rawBalance: '0x1', fiat: { balance: 300 } }],
      } as never);

      const result = getAvailableBatchSellNetworks(buildState());

      const chainIds = result.map((n) => n.chainId);
      // Optimism (0xa / eip155:10) is not in BATCH_SELL_SUPPORTED_CHAIN_IDS
      expect(chainIds).not.toContain(CAIP_OPTIMISM);
      // Supported networks sorted: Base ($1000) then Mainnet ($500)
      expect(chainIds).toStrictEqual([CAIP_BASE, CAIP_MAINNET]);
    });

    it('returns empty array when no supported networks have positive balance', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_OPTIMISM]: MOCK_OPTIMISM_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        '0xa': [{ rawBalance: '0x1', fiat: { balance: 300 } }],
      } as never);

      const result = getAvailableBatchSellNetworks(buildState());

      expect(result).toStrictEqual([]);
    });

    it('includes chainId, name, and imageUrl in returned network objects', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1', fiat: { balance: 100 } }],
      } as never);

      const [network] = getAvailableBatchSellNetworks(buildState());

      expect(network).toMatchObject({
        chainId: CAIP_MAINNET,
        name: 'Ethereum Mainnet',
        imageUrl: expect.any(String),
      });
    });

    it('returns all six supported chains when they all have positive balance', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: { ...MOCK_MAINNET_NETWORK },
        [CAIP_BASE]: { ...MOCK_BASE_NETWORK },
        [CAIP_BSC]: { chainId: CAIP_BSC, name: 'BSC' },
        [CAIP_ARBITRUM]: { chainId: CAIP_ARBITRUM, name: 'Arbitrum' },
        [CAIP_POLYGON]: { chainId: CAIP_POLYGON, name: 'Polygon' },
        [CAIP_LINEA]: { chainId: CAIP_LINEA, name: 'Linea' },
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1', fiat: { balance: 10 } }],
        [CHAIN_IDS.BASE]: [{ rawBalance: '0x1', fiat: { balance: 20 } }],
        [CHAIN_IDS.BSC]: [{ rawBalance: '0x1', fiat: { balance: 30 } }],
        [CHAIN_IDS.ARBITRUM]: [{ rawBalance: '0x1', fiat: { balance: 40 } }],
        [CHAIN_IDS.POLYGON]: [{ rawBalance: '0x1', fiat: { balance: 50 } }],
        [CHAIN_IDS.LINEA_MAINNET]: [
          { rawBalance: '0x1', fiat: { balance: 60 } },
        ],
      } as never);

      const result = getAvailableBatchSellNetworks(buildState());

      expect(result).toHaveLength(6);
    });

    it('filters out networks where getBatchSellDestStablecoinsForNetwork returns empty', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
        [CAIP_BASE]: MOCK_BASE_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1', fiat: { balance: 500 } }],
        [CHAIN_IDS.BASE]: [{ rawBalance: '0x1', fiat: { balance: 1000 } }],
      } as never);
      // Only Mainnet has stablecoins configured; Base has none.
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [
              'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            ],
          },
          [CAIP_BASE]: { batchSellDestStablecoins: [] },
        },
      } as never);

      const result = getAvailableBatchSellNetworks(buildState());

      expect(result.map((n) => n.chainId)).toStrictEqual([CAIP_MAINNET]);
    });

    it('excludes a network whose only holdings are ineligible (e.g. all stablecoins)', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
        [CAIP_BASE]: MOCK_BASE_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1', fiat: { balance: 500 } }],
        [CHAIN_IDS.BASE]: [{ rawBalance: '0x1', fiat: { balance: 1000 } }],
      } as never);
      // Base's only holding is its own destination stablecoin, so there is
      // nothing sellable on Base even though it has a positive balance.
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [CAIP_MAINNET]: eligibleHolding(CAIP_MAINNET, '1'),
        [CAIP_BASE]: {
          assetId: 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
          chainId: CAIP_BASE,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          balance: '100',
        },
      } as never);

      const result = getAvailableBatchSellNetworks(buildState());

      expect(result.map((n) => n.chainId)).toStrictEqual([CAIP_MAINNET]);
    });
  });

  describe('selectBatchSellDestStablecoins', () => {
    const USDC_ASSET_ID = BATCH_SELL_ASSET_IDS.USDC as unknown as CaipChainId;

    it('returns empty array when chainId is undefined', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {},
      } as never);

      const result = getBatchSellDestStablecoinsForNetwork(
        buildState(),
        undefined,
      );

      expect(result).toStrictEqual([]);
    });

    it('returns checksummed stablecoin asset ids for a given chainId', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [USDC_ASSET_ID],
          },
        },
      } as never);

      const result = getBatchSellDestStablecoinsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('erc20:');
    });

    it('returns empty array when chain has no batchSellDestStablecoins', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: { isActiveSrc: true, isActiveDest: true },
        },
      } as never);

      const result = getBatchSellDestStablecoinsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toStrictEqual([]);
    });

    it('returns empty array when chainId is not in flags', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {},
      } as never);

      const result = getBatchSellDestStablecoinsForNetwork(
        buildState(),
        CAIP_BASE,
      );

      expect(result).toStrictEqual([]);
    });
  });

  describe('getAvailableBatchSellAssetsForNetworkSelector', () => {
    const ETH_ASSET_ID = `${CAIP_MAINNET}/slip44:60` as CaipChainId;
    const USDT_ASSET_ID =
      `${CAIP_MAINNET}/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7` as CaipChainId;
    const ETH_BRIDGE_TOKEN = {
      assetId: ETH_ASSET_ID,
      chainId: CAIP_MAINNET,
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      balance: '1.5',
      tokenFiatAmount: 3000,
      iconUrl: undefined,
    };
    const USDT_BRIDGE_TOKEN = {
      assetId: USDT_ASSET_ID,
      chainId: CAIP_MAINNET,
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      balance: '100',
      tokenFiatAmount: 100,
      iconUrl: 'https://example.com/usdt.png',
    };

    beforeEach(() => {
      mockGetAssetsRates.mockReturnValue({} as never);
      mockGetMarketData.mockReturnValue({
        [CHAIN_IDS.MAINNET]: {
          '0x0000000000000000000000000000000000000000': {
            price: 2000,
            pricePercentChange1d: 1.5,
          },
          '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
            price: 1,
            pricePercentChange1d: 0.01,
          },
        },
      } as never);
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {},
      } as never);
      mockGetBridgeAssetsByAssetId.mockReturnValue({});
    });

    it('returns empty array when selectedChainId is null', () => {
      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        null,
      );

      expect(result).toStrictEqual([]);
    });

    it('returns mapped assets for the selected EVM chain', () => {
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
        [USDT_ASSET_ID.toLowerCase()]: USDT_BRIDGE_TOKEN,
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(
        expect.objectContaining({
          assetId: ETH_ASSET_ID,
          name: 'Ether',
          symbol: 'ETH',
          chainId: CAIP_MAINNET,
        }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          assetId: USDT_ASSET_ID,
          name: 'Tether USD',
          symbol: 'USDT',
          chainId: CAIP_MAINNET,
        }),
      );
    });

    it('filters out assets with zero balance', () => {
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: { ...ETH_BRIDGE_TOKEN, balance: '0' },
        [USDT_ASSET_ID.toLowerCase()]: USDT_BRIDGE_TOKEN,
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('USDT');
    });

    it('filters out stablecoin assets', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [USDT_ASSET_ID],
          },
        },
      } as never);
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
        [USDT_ASSET_ID.toLowerCase()]: USDT_BRIDGE_TOKEN,
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
    });

    it('filters out stock RWA tokens', () => {
      const RWA_ASSET_ID =
        `${CAIP_MAINNET}/erc20:0xaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa` as CaipChainId;
      const RWA_BRIDGE_TOKEN = {
        assetId: RWA_ASSET_ID,
        chainId: CAIP_MAINNET,
        symbol: 'AAPL',
        name: 'Apple Stock',
        decimals: 18,
        balance: '1',
        tokenFiatAmount: 200,
        iconUrl: undefined,
        rwaData: { instrumentType: 'stock' },
      };
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
        [RWA_ASSET_ID.toLowerCase()]: RWA_BRIDGE_TOKEN,
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
    });

    it('filters out tokens whose name includes "Ondo Tokenized"', () => {
      const ONDO_ASSET_ID =
        `${CAIP_MAINNET}/erc20:0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb` as CaipChainId;
      const ONDO_BRIDGE_TOKEN = {
        assetId: ONDO_ASSET_ID,
        chainId: CAIP_MAINNET,
        symbol: 'OUSG',
        name: 'Ondo Tokenized Short-Term US Government Bond Fund',
        decimals: 18,
        balance: '5',
        tokenFiatAmount: 500,
        iconUrl: undefined,
      };
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
        [ONDO_ASSET_ID.toLowerCase()]: ONDO_BRIDGE_TOKEN,
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
    });

    it('does not filter out tokens whose name only partially resembles "Ondo Tokenized"', () => {
      const OTHER_ASSET_ID =
        `${CAIP_MAINNET}/erc20:0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc` as CaipChainId;
      const OTHER_BRIDGE_TOKEN = {
        assetId: OTHER_ASSET_ID,
        chainId: CAIP_MAINNET,
        symbol: 'ONDO',
        name: 'Ondo Finance',
        decimals: 18,
        balance: '10',
        tokenFiatAmount: 100,
        iconUrl: undefined,
      };
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
        [OTHER_ASSET_ID.toLowerCase()]: OTHER_BRIDGE_TOKEN,
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.symbol)).toContain('ONDO');
    });

    it('populates tokenFiatPrice and percentageChange from marketData for EVM native asset', () => {
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
      } as never);

      const [ethResult] = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(ethResult.tokenFiatPrice).toBe(2000);
      expect(ethResult.percentageChange).toBe(1.5);
    });

    it('populates tokenFiatPrice and percentageChange from marketData for EVM ERC-20 assets', () => {
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [USDT_ASSET_ID.toLowerCase()]: USDT_BRIDGE_TOKEN,
      } as never);

      const [usdtResult] = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(usdtResult.tokenFiatPrice).toBe(1);
      expect(usdtResult.percentageChange).toBe(0.01);
    });

    it('returns empty array when chain has no assets', () => {
      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toStrictEqual([]);
    });

    it('falls back to a chain-derived icon url when the bridge token has no iconUrl', () => {
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [ETH_ASSET_ID.toLowerCase()]: ETH_BRIDGE_TOKEN,
      } as never);

      const [ethResult] = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(ethResult.iconUrl).toBeDefined();
    });

    it('preserves the bridge token iconUrl for ERC-20 tokens', () => {
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [USDT_ASSET_ID.toLowerCase()]: USDT_BRIDGE_TOKEN,
      } as never);

      const [usdtResult] = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        CAIP_MAINNET,
      );

      expect(usdtResult.iconUrl).toBe('https://example.com/usdt.png');
    });

    it('uses assetsRates for non-EVM chain assets', () => {
      const SOLANA_CHAIN_ID =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId;
      const SOL_ASSET_ID = `${SOLANA_CHAIN_ID}/slip44:501` as CaipChainId;
      const SOL_BRIDGE_TOKEN = {
        assetId: SOL_ASSET_ID,
        chainId: SOLANA_CHAIN_ID,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        balance: '2',
        tokenFiatAmount: 300,
        iconUrl: undefined,
      };

      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [SOL_ASSET_ID.toLowerCase()]: SOL_BRIDGE_TOKEN,
      } as never);
      mockGetAssetsRates.mockReturnValue({
        [SOL_ASSET_ID]: {
          rate: '150',
          marketData: { pricePercentChange: { P1D: 3.5 } },
        },
      } as never);

      const result = getAvailableBatchSellSwapAssetsForNetwork(
        buildState(),
        SOLANA_CHAIN_ID,
      );

      expect(result).toHaveLength(1);
      expect(result[0].tokenFiatPrice).toBe(150);
      expect(result[0].percentageChange).toBe(3.5);
    });
  });

  describe('getAvailableBatchSellReceiveAssetsForNetwork', () => {
    // USDC on Mainnet – present in BATCH_SELL_DEST_STABLECOIN_METADATA (lowercase key)
    const USDC_MAINNET_ASSET_ID =
      'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

    // The selector reads state.metamask.tokensChainsCache directly, so every
    // test needs a state object that at least has metamask.tokensChainsCache.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildReceiveState = (tokensChainsCache: any = {}): any => ({
      metamask: { tokensChainsCache },
    });

    beforeEach(() => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [USDC_MAINNET_ASSET_ID],
          },
        },
      } as never);
      mockGetBridgeAssetsByAssetId.mockReturnValue({});
    });

    it('returns empty array when chainId is undefined', () => {
      const result = getAvailableBatchSellReceiveAssetsForNetwork(
        buildReceiveState(),
        undefined,
      );

      expect(result).toStrictEqual([]);
    });

    it('returns the held asset when the user holds the stablecoin', () => {
      const heldToken = {
        assetId: USDC_MAINNET_ASSET_ID as CaipChainId,
        chainId: CAIP_MAINNET,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '250',
        tokenFiatAmount: 250,
        iconUrl: 'https://held.example/usdc.png',
      };
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [USDC_MAINNET_ASSET_ID]: heldToken,
      } as never);

      const result = getAvailableBatchSellReceiveAssetsForNetwork(
        buildReceiveState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        assetId: USDC_MAINNET_ASSET_ID,
        balance: '250',
        iconUrl: 'https://held.example/usdc.png',
      });
    });

    it('returns static metadata when the stablecoin is not held by the user', () => {
      const result = getAvailableBatchSellReceiveAssetsForNetwork(
        buildReceiveState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        assetId: USDC_MAINNET_ASSET_ID,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        balance: '0',
      });
      // iconUrl comes from the static CDN URL in BATCH_SELL_DEST_STABLECOIN_METADATA
      expect(result[0].iconUrl).toContain('metamask.io');
    });

    it('falls back to tokensChainsCache when stablecoin is absent from static metadata', () => {
      // A token address not present in BATCH_SELL_DEST_STABLECOIN_METADATA
      const UNKNOWN_ASSET_ID =
        'eip155:1/erc20:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [UNKNOWN_ASSET_ID],
          },
        },
      } as never);

      const state = buildReceiveState({
        '0x1': {
          data: {
            '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa': {
              symbol: 'UNKN',
              name: 'Unknown Token',
              decimals: 18,
              iconUrl: 'https://example.com/unkn.png',
            },
          },
        },
      });

      const result = getAvailableBatchSellReceiveAssetsForNetwork(
        state,
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        assetId: UNKNOWN_ASSET_ID,
        symbol: 'UNKN',
        name: 'Unknown Token',
        decimals: 18,
        balance: '0',
        iconUrl: 'https://example.com/unkn.png',
      });
    });

    it('filters out stablecoins absent from both static metadata and cache', () => {
      const UNKNOWN_ASSET_ID =
        'eip155:1/erc20:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [UNKNOWN_ASSET_ID],
          },
        },
      } as never);

      const result = getAvailableBatchSellReceiveAssetsForNetwork(
        buildReceiveState(),
        CAIP_MAINNET,
      );

      expect(result).toStrictEqual([]);
    });

    it('static metadata path sets balance to "0" and supplies an iconUrl', () => {
      const [asset] = getAvailableBatchSellReceiveAssetsForNetwork(
        buildReceiveState(),
        CAIP_MAINNET,
      );

      expect(asset.balance).toBe('0');
      expect(asset.iconUrl).toBeTruthy();
    });

    it('cache path applies a fallback iconUrl when the cache entry has none', () => {
      const UNKNOWN_ASSET_ID =
        'eip155:1/erc20:0xcccccccccccccccccccccccccccccccccccccccc';
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [UNKNOWN_ASSET_ID],
          },
        },
      } as never);

      const state = buildReceiveState({
        '0x1': {
          data: {
            // no iconUrl property
            '0xcccccccccccccccccccccccccccccccccccccccc': {
              symbol: 'CCCC',
              name: 'CToken',
              decimals: 6,
            },
          },
        },
      });

      const [asset] = getAvailableBatchSellReceiveAssetsForNetwork(
        state,
        CAIP_MAINNET,
      );

      // The selector applies getAssetImageUrl as a final fallback
      expect(asset.iconUrl).toBeTruthy();
    });
  });

  describe('selectFiatBalanceByChain (asset without fiat)', () => {
    it('treats missing fiat.balance as 0 when computing chain fiat total', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
        [CAIP_BASE]: MOCK_BASE_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        // Asset has no fiat property at all
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1' }],
        [CHAIN_IDS.BASE]: [{ rawBalance: '0x1', fiat: { balance: 100 } }],
      } as never);
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [
              'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            ],
          },
          [CAIP_BASE]: {
            batchSellDestStablecoins: [
              'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            ],
          },
        },
      } as never);
      mockGetBridgeAssetsByAssetId.mockReturnValue({
        [CAIP_MAINNET]: eligibleHolding(CAIP_MAINNET, '1'),
        [CAIP_BASE]: eligibleHolding(CAIP_BASE, '2'),
      } as never);

      const result = getAvailableBatchSellNetworks(buildState());

      // Base ($100) should appear before Mainnet ($0)
      expect(result[0].chainId).toBe(CAIP_BASE);
      expect(result[1].chainId).toBe(CAIP_MAINNET);
    });
  });
});
