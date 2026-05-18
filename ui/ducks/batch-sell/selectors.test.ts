import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { EthAccountType } from '@metamask/keyring-api';
import type { CaipChainId } from '@metamask/utils';
import { setGlobalDevModeChecks } from 'reselect';
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
  getNetworksForSelectedAccount,
  getNetworksWithPositiveBalanceForSelectedAccount,
  getAvailableBatchSellNetworks,
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

  describe('getNetworksForSelectedAccount', () => {
    it('returns empty object when no account is selected', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue(ALL_NETWORKS);
      mockGetSelectedInternalAccount.mockReturnValue(null as never);

      const result = getNetworksForSelectedAccount(buildState());

      expect(result).toStrictEqual({});
    });

    it('returns all EVM networks for an EVM account', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue(ALL_NETWORKS);
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);

      const result = getNetworksForSelectedAccount(buildState());

      expect(result).toStrictEqual({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
        [CAIP_BASE]: MOCK_BASE_NETWORK,
        [CAIP_OPTIMISM]: MOCK_OPTIMISM_NETWORK,
      });
      expect(result).not.toHaveProperty(MOCK_SOLANA_NETWORK.chainId);
    });

    it('returns only scoped networks for a non-EVM account', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue(ALL_NETWORKS);
      mockGetSelectedInternalAccount.mockReturnValue(
        MOCK_SOLANA_ACCOUNT as never,
      );

      const result = getNetworksForSelectedAccount(buildState());

      expect(result).toStrictEqual({
        [MOCK_SOLANA_NETWORK.chainId]: MOCK_SOLANA_NETWORK,
      });
    });

    it('returns empty object when non-EVM account has no matching scopes', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue(ALL_NETWORKS);
      mockGetSelectedInternalAccount.mockReturnValue({
        ...MOCK_SOLANA_ACCOUNT,
        scopes: ['bitcoin:mainnet' as CaipChainId],
      } as never);

      const result = getNetworksForSelectedAccount(buildState());

      expect(result).toStrictEqual({});
    });
  });

  describe('getNetworksWithPositiveBalanceForSelectedAccount', () => {
    it('returns only networks that have at least one asset with positive balance', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
        [CAIP_BASE]: MOCK_BASE_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x1', fiat: { balance: 100 } }],
        [CHAIN_IDS.BASE]: [{ rawBalance: '0x0', fiat: { balance: 0 } }],
      } as never);

      const result =
        getNetworksWithPositiveBalanceForSelectedAccount(buildState());

      expect(result).toHaveProperty(CAIP_MAINNET);
      expect(result).not.toHaveProperty(CAIP_BASE);
    });

    it('returns empty object when all balances are zero', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [CAIP_MAINNET]: MOCK_MAINNET_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(MOCK_EVM_ACCOUNT as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ rawBalance: '0x0' }],
      } as never);

      const result =
        getNetworksWithPositiveBalanceForSelectedAccount(buildState());

      expect(result).toStrictEqual({});
    });
  });

  describe('getAvailableBatchSellNetworksSelector', () => {
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
  });

  describe('selectBatchSellDestStablecoins', () => {
    const USDC_ASSET_ID =
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipChainId;

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

  describe('selectChainsWithPositiveBalanceForSelectedAccount (non-EVM chain key)', () => {
    it('includes a non-EVM chain id as-is when it has positive balance', () => {
      const SOLANA_CHAIN_ID =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId;

      mockGetAllMultichainNetworkConfigurations.mockReturnValue({
        [SOLANA_CHAIN_ID]: MOCK_SOLANA_NETWORK,
      });
      mockGetSelectedInternalAccount.mockReturnValue(
        MOCK_SOLANA_ACCOUNT as never,
      );
      // The key is already a CAIP chain id (non-hex), positive balance
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [SOLANA_CHAIN_ID]: [{ rawBalance: '0x1', fiat: { balance: 50 } }],
      } as never);

      const result =
        getNetworksWithPositiveBalanceForSelectedAccount(buildState());

      expect(result).toHaveProperty(SOLANA_CHAIN_ID);
    });
  });

  describe('getNetworksForSelectedAccount (scopes nullish fallback)', () => {
    it('treats undefined scopes as empty set for non-EVM accounts', () => {
      mockGetAllMultichainNetworkConfigurations.mockReturnValue(ALL_NETWORKS);
      mockGetSelectedInternalAccount.mockReturnValue({
        ...MOCK_SOLANA_ACCOUNT,
        scopes: undefined,
      } as never);

      const result = getNetworksForSelectedAccount(buildState());

      expect(result).toStrictEqual({});
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

      const result = getAvailableBatchSellNetworks(buildState());

      // Base ($100) should appear before Mainnet ($0)
      expect(result[0].chainId).toBe(CAIP_BASE);
      expect(result[1].chainId).toBe(CAIP_MAINNET);
    });
  });
});
