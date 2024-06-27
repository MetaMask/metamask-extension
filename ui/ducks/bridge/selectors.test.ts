import { ProviderConfig } from '@metamask/network-controller';
import { getProviderConfig } from '../metamask/metamask';
import {
  getAllBridgeableNetworks,
  getFromChain,
  getFromChains,
  getFromToken,
  getIsBridgeTx,
  getToChain,
  getToChains,
  getToToken,
} from './selectors';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = {
        metamask: { providerConfig: { chainId: '0x1' } },
      };

      const result = getFromChain(state);
      expect(result).toStrictEqual({ chainId: '0x1' });

      const providerConfig = getProviderConfig(state);
      expect(result).toStrictEqual(providerConfig);
    });
  });

  describe('getToChain', () => {
    it('returns the toChain from the state', () => {
      const state = {
        bridge: {
          toChain: { chainId: '0x1' } as unknown as ProviderConfig,
        },
      };

      const result = getToChain(state);

      expect(result).toStrictEqual({ chainId: '0x1' });
    });
  });

  describe('getAllBridgeableNetworks', () => {
    it('returns list of ALLOWED_BRIDGE_CHAIN_IDS networks', () => {
      const state = createBridgeMockStore();
      const result = getAllBridgeableNetworks(state);

      expect(result).toHaveLength(9);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(result.slice(2)).toStrictEqual(FEATURED_RPCS);
      result.forEach(({ chainId }) => {
        expect(ALLOWED_BRIDGE_CHAIN_IDS).toContain(chainId);
      });
      ALLOWED_BRIDGE_CHAIN_IDS.forEach((allowedChainId) => {
        expect(
          result.findIndex(({ chainId }) => chainId === allowedChainId),
        ).toBeGreaterThan(-1);
      });
    });

    it('uses config from allNetworks if network is in both FEATURED_RPCS and allNetworks', () => {
      const addedFeaturedNetwork = {
        ...FEATURED_RPCS[FEATURED_RPCS.length - 1],
        id: 'testid',
      };
      const state = {
        ...createBridgeMockStore(),
        metamask: {
          networkConfigurations: [addedFeaturedNetwork],
        },
      };
      const result = getAllBridgeableNetworks(state);

      expect(result).toHaveLength(9);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(result[2]).toStrictEqual({
        ...addedFeaturedNetwork,
        removable: true,
      });
      expect(result.slice(3)).toStrictEqual(FEATURED_RPCS.slice(0, -1));
    });

    it('returns network if included in ALLOWED_BRIDGE_CHAIN_IDS', () => {
      const addedFeaturedNetwork = {
        chainId: '0x11212131241523151',
        nickname: 'scroll',
        rpcUrl: 'https://a',
        ticker: 'ETH',
        rpcPrefs: {
          blockExplorerUrl: 'https://a',
          imageUrl: 'https://a',
        },
      };
      const state = {
        ...createBridgeMockStore(),
        metamask: {
          networkConfigurations: [addedFeaturedNetwork],
        },
      };
      const result = getAllBridgeableNetworks(state);

      expect(result).toHaveLength(9);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(result.slice(2)).toStrictEqual(FEATURED_RPCS);
    });
  });

  describe('getFromChains', () => {
    it('excludes selected toChain and disabled chains from options', () => {
      const state = createBridgeMockStore(
        {
          srcNetworkAllowlist: [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.OPTIMISM,
            CHAIN_IDS.POLYGON,
          ],
        },
        { toChain: { chainId: CHAIN_IDS.MAINNET } },
      );
      const result = getFromChains(state);

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getFromChains(state);

      expect(result).toHaveLength(0);
    });
  });

  describe('getToChains', () => {
    it('excludes selected providerConfig and disabled chains from options', () => {
      const state = createBridgeMockStore({
        destNetworkAllowlist: [
          CHAIN_IDS.MAINNET,
          CHAIN_IDS.OPTIMISM,
          CHAIN_IDS.POLYGON,
        ],
      });
      const result = getToChains(state);

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getToChains(state);

      expect(result).toHaveLength(0);
    });
  });

  describe('getIsBridgeTx', () => {
    it('returns false if bridge is not enabled', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: false } },
        },
        bridge: { toChain: { chainId: '0x38' } as unknown as ProviderConfig },
      };

      const result = getIsBridgeTx(state);

      expect(result).toBe(false);
    });

    it('returns false if toChain is null', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: null },
      };

      const result = getIsBridgeTx(state);

      expect(result).toBe(false);
    });

    it('returns false if fromChain and toChain have the same chainId', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x1' } },
      };

      const result = getIsBridgeTx(state);

      expect(result).toBe(false);
    });

    it('returns false if useExternalServices is not enabled', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: false,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state);

      expect(result).toBe(false);
    });

    it('returns true if bridge is enabled and fromChain and toChain have different chainIds', () => {
      const state = {
        metamask: {
          providerConfig: { chainId: '0x1' },
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state);

      expect(result).toBe(true);
    });
  });

  describe('getFromToken', () => {
    it('returns swaps fromToken', () => {
      const state = createBridgeMockStore(
        {},
        {},
        { fromToken: { address: '0x123', symbol: 'TEST' } },
      );
      const result = getFromToken(state);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns defaultToken if fromToken has no address', () => {
      const state = createBridgeMockStore(
        {},
        {},
        { fromToken: { symbol: 'NATIVE' } },
      );
      const result = getFromToken(state);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        balance: '0',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        string: '0',
        symbol: 'ETH',
      });
    });

    it('returns defautlToken if fromToken is undefined', () => {
      const state = createBridgeMockStore({}, {}, { fromToken: null });
      const result = getFromToken(state);

      expect(result).toStrictEqual({
        address: '0x0000000000000000000000000000000000000000',
        balance: '0',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        string: '0',
        symbol: 'ETH',
      });
    });
  });

  describe('getToToken', () => {
    it('returns swaps toToken', () => {
      const state = createBridgeMockStore(
        {},
        {},
        { toToken: { address: '0x123', symbol: 'TEST' } },
      );
      const result = getToToken(state);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns undefined if swaps toToken is undefined', () => {
      const state = createBridgeMockStore({}, {}, { toToken: null });
      const result = getToToken(state);

      expect(result).toStrictEqual(null);
    });
  });
});
