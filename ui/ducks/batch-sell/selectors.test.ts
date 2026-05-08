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
  getSelectedInternalAccount,
} from '../../selectors';
import { getBridgeFeatureFlags } from '../bridge/selectors';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  getNetworksForSelectedAccount,
  getNetworksWithPositiveBalanceForSelectedAccount,
  getAvailableBatchSellNetworksSelector,
  selectBatchSellDestStablecoins,
  getAvailableBatchSellAssetsForNetworkSelector,
} from './selectors';

jest.mock('../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
  getAssetsRates: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getAllMultichainNetworkConfigurations: jest.fn(),
  getMarketData: jest.fn(),
  getSelectedInternalAccount: jest.fn(),
}));

jest.mock('../bridge/selectors', () => ({
  getBridgeFeatureFlags: jest.fn(),
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

      const result = getAvailableBatchSellNetworksSelector(buildState());

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

      const result = getAvailableBatchSellNetworksSelector(buildState());

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

      const [network] = getAvailableBatchSellNetworksSelector(buildState());

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

      const result = getAvailableBatchSellNetworksSelector(buildState());

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

      const result = selectBatchSellDestStablecoins(buildState(), undefined);

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

      const result = selectBatchSellDestStablecoins(buildState(), CAIP_MAINNET);

      expect(result).toHaveLength(1);
      expect(result[0]).toContain('erc20:');
    });

    it('returns empty array when chain has no batchSellDestStablecoins', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: { isActiveSrc: true, isActiveDest: true },
        },
      } as never);

      const result = selectBatchSellDestStablecoins(buildState(), CAIP_MAINNET);

      expect(result).toStrictEqual([]);
    });

    it('returns empty array when chainId is not in flags', () => {
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {},
      } as never);

      const result = selectBatchSellDestStablecoins(buildState(), CAIP_BASE);

      expect(result).toStrictEqual([]);
    });
  });

  describe('getAvailableBatchSellAssetsForNetworkSelector', () => {
    const ETH_ASSET = {
      assetId: `${CAIP_MAINNET}/slip44:60`,
      name: 'Ether',
      symbol: 'ETH',
      image: undefined,
      balance: '1.5',
      fiat: { balance: 3000 },
      rawBalance: '0x14D1120D7B16000',
      isNative: true,
    };

    const ERC20_ASSET = {
      assetId: `${CAIP_MAINNET}/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7`,
      name: 'Tether USD',
      symbol: 'USDT',
      image: 'https://example.com/usdt.png',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
      balance: '100',
      fiat: { balance: 100 },
      rawBalance: '0x5F5E100',
      isNative: false,
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
    });

    it('returns empty array when selectedChainId is null', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({} as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        null,
      );

      expect(result).toStrictEqual([]);
    });

    it('returns mapped assets for the selected EVM chain', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [ETH_ASSET, ERC20_ASSET],
      } as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        assetId: ETH_ASSET.assetId,
        name: 'Ether',
        symbol: 'ETH',
        isNative: true,
        chainId: CAIP_MAINNET,
      });
      expect(result[1]).toMatchObject({
        assetId: ERC20_ASSET.assetId,
        name: 'Tether USD',
        symbol: 'USDT',
        isNative: false,
        chainId: CAIP_MAINNET,
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      });
    });

    it('filters out assets with zero balance', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [{ ...ETH_ASSET, rawBalance: '0x0' }, ERC20_ASSET],
      } as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('USDT');
    });

    it('filters out stablecoin assets', () => {
      const USDT_CAIP =
        `${CAIP_MAINNET}/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7` as CaipChainId;
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: {
            batchSellDestStablecoins: [USDT_CAIP],
          },
        },
      } as never);
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [ETH_ASSET, ERC20_ASSET],
      } as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
    });

    it('populates tokenFiatPrice and percentageChange from marketData for EVM assets', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [ETH_ASSET],
      } as never);

      const [ethResult] = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      expect(ethResult.tokenFiatPrice).toBe(2000);
      expect(ethResult.percentageChange).toBe(1.5);
    });

    it('returns empty array when chain has no assets', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({} as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      expect(result).toStrictEqual([]);
    });

    it('uses CHAIN_ID_TOKEN_IMAGE_MAP for EVM native token image', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [ETH_ASSET],
      } as never);

      const [ethResult] = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      // ETH on mainnet should have a defined image from CHAIN_ID_TOKEN_IMAGE_MAP
      expect(ethResult.image).toBeDefined();
    });

    it('uses asset image for ERC-20 tokens', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [ERC20_ASSET],
      } as never);

      const [erc20Result] = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      expect(erc20Result.image).toBe('https://example.com/usdt.png');
    });

    it('uses assetsRates for non-EVM chain assets', () => {
      const SOLANA_CHAIN_ID =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as CaipChainId;
      const SOL_ASSET_ID = `${SOLANA_CHAIN_ID}/slip44:501` as CaipChainId;
      const SOL_ASSET = {
        assetId: SOL_ASSET_ID,
        name: 'Solana',
        symbol: 'SOL',
        image: undefined,
        balance: '2',
        fiat: { balance: 300 },
        rawBalance: '0x1',
        isNative: true,
      };

      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [SOLANA_CHAIN_ID]: [SOL_ASSET],
      } as never);
      mockGetAssetsRates.mockReturnValue({
        [SOL_ASSET_ID]: {
          rate: '150',
          marketData: { pricePercentChange: { P1D: 3.5 } },
        },
      } as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        SOLANA_CHAIN_ID,
      );

      expect(result).toHaveLength(1);
      expect(result[0].tokenFiatPrice).toBe(150);
      expect(result[0].percentageChange).toBe(3.5);
      expect(result[0].address).toBeUndefined();
    });

    it('does not filter out a stablecoin-listed ERC-20 asset that has no address property (isStablecoin address fallback)', () => {
      // ERC-20 asset without `address` property falls back to assetId in
      // isStablecoin; if the assetId happens to match a stablecoin it is filtered.
      const USDT_ASSET_ID =
        `${CAIP_MAINNET}/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7` as CaipChainId;
      mockGetBridgeFeatureFlags.mockReturnValue({
        chains: {
          [CAIP_MAINNET]: { batchSellDestStablecoins: [USDT_ASSET_ID] },
        },
      } as never);
      // Asset has no `address` property – isStablecoin must still work via assetId
      const ERC20_WITHOUT_ADDRESS = {
        assetId: USDT_ASSET_ID,
        name: 'Tether USD',
        symbol: 'USDT',
        image: 'usdt.png',
        balance: '100',
        fiat: { balance: 100 },
        rawBalance: '0x5F5E100',
        isNative: false,
        // no `address` property
      };
      mockGetAssetsBySelectedAccountGroup.mockReturnValue({
        [CHAIN_IDS.MAINNET]: [ETH_ASSET, ERC20_WITHOUT_ADDRESS],
      } as never);

      const result = getAvailableBatchSellAssetsForNetworkSelector(
        buildState(),
        CAIP_MAINNET,
      );

      // USDT (matched via assetId fallback) should be filtered out
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('ETH');
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

      const result = getAvailableBatchSellNetworksSelector(buildState());

      // Base ($100) should appear before Mainnet ($0)
      expect(result[0].chainId).toBe(CAIP_BASE);
      expect(result[1].chainId).toBe(CAIP_MAINNET);
    });
  });
});
