import { createBridgeMockStore } from '../../../test/jest/mock-store';
import { CHAIN_IDS, FEATURED_RPCS } from '../../../shared/constants/network';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import { getProviderConfig } from '../metamask/metamask';
import { mockNetworkState } from '../../../test/stub/networks';
import {
  getAllBridgeableNetworks,
  getFromAmount,
  getFromChain,
  getFromChains,
  getFromToken,
  getIsBridgeTx,
  getToAmount,
  getToChain,
  getToChains,
  getToToken,
} from './selectors';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = {
        metamask: { ...mockNetworkState({ chainId: '0x1' }) },
      };
      const result = getFromChain(state as never);
      expect(result).toStrictEqual(getProviderConfig(state));
    });
  });

  describe('getToChain', () => {
    it('returns the toChain from the state', () => {
      const state = {
        bridge: {
          toChain: { chainId: '0x1' } as unknown,
        },
      };

      const result = getToChain(state as never);

      expect(result).toStrictEqual({ chainId: '0x1' });
    });
  });

  describe('getAllBridgeableNetworks', () => {
    it('returns list of ALLOWED_BRIDGE_CHAIN_IDS networks', () => {
      const state = createBridgeMockStore();
      const result = getAllBridgeableNetworks(state as never);

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
      };

      const state = {
        ...createBridgeMockStore(),
        metamask: {
          networkConfigurations: [addedFeaturedNetwork],
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            {
              ...FEATURED_RPCS[FEATURED_RPCS.length - 1],
              id: 'testid',
              blockExplorerUrl: 'https://basescan.org',
              rpcUrl: 'https://mainnet.base.org',
            },
          ),
        },
      };
      const result = getAllBridgeableNetworks(state as never);

      expect(result).toHaveLength(9);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(result[2]).toStrictEqual({
        blockExplorerUrls: addedFeaturedNetwork.blockExplorerUrls,
        chainId: addedFeaturedNetwork.chainId,
        defaultBlockExplorerUrlIndex:
          addedFeaturedNetwork.defaultBlockExplorerUrlIndex,
        defaultRpcEndpointIndex: addedFeaturedNetwork.defaultRpcEndpointIndex,
        name: addedFeaturedNetwork.name,
        nativeCurrency: addedFeaturedNetwork.nativeCurrency,
        rpcEndpoints: [
          {
            networkClientId: 'testid',
            ...addedFeaturedNetwork.rpcEndpoints[0],
          },
        ],
      });
      expect(result.slice(3)).toStrictEqual(FEATURED_RPCS.slice(0, -1));
    });

    it('returns network if included in ALLOWED_BRIDGE_CHAIN_IDS', () => {
      const state = {
        ...createBridgeMockStore(),
        metamask: {
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
          ),
        },
      };
      const result = getAllBridgeableNetworks(state as never);

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
      const result = getFromChains(state as never);

      expect(result).toHaveLength(3);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[2]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getFromChains(state as never);

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
      const result = getToChains(state as never);

      expect(result).toHaveLength(3);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[2]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
      );
    });

    it('returns empty list when bridgeFeatureFlags are not set', () => {
      const state = createBridgeMockStore();
      const result = getToChains(state as never);

      expect(result).toHaveLength(0);
    });
  });

  describe('getIsBridgeTx', () => {
    it('returns false if bridge is not enabled', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: '0x1' }),
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: false } },
        },
        bridge: { toChain: { chainId: '0x38' } as unknown },
      };

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if toChain is null', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: '0x1' }),
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: null },
      };

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if fromChain and toChain have the same chainId', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: '0x1' }),
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x1' } },
      };

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if useExternalServices is not enabled', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: '0x1' }),
          useExternalServices: false,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns true if bridge is enabled and fromChain and toChain have different chainIds', () => {
      const state = {
        metamask: {
          ...mockNetworkState({ chainId: '0x1' }),
          useExternalServices: true,
          bridgeState: { bridgeFeatureFlags: { extensionSupport: true } },
        },
        bridge: { toChain: { chainId: '0x38' } },
      };

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(true);
    });
  });

  describe('getFromToken', () => {
    it('returns fromToken', () => {
      const state = createBridgeMockStore(
        {},

        { fromToken: { address: '0x123', symbol: 'TEST' } },
      );
      const result = getFromToken(state as never);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns defaultToken if fromToken has no address', () => {
      const state = createBridgeMockStore(
        {},
        { fromToken: { symbol: 'NATIVE' } },
      );
      const result = getFromToken(state as never);

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

    it('returns defaultToken if fromToken is undefined', () => {
      const state = createBridgeMockStore({}, { fromToken: undefined });
      const result = getFromToken(state as never);

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
    it('returns toToken', () => {
      const state = createBridgeMockStore(
        {},
        { toToken: { address: '0x123', symbol: 'TEST' } },
      );
      const result = getToToken(state as never);

      expect(result).toStrictEqual({ address: '0x123', symbol: 'TEST' });
    });

    it('returns undefined if toToken is undefined', () => {
      const state = createBridgeMockStore({}, { toToken: null });
      const result = getToToken(state as never);

      expect(result).toStrictEqual(null);
    });
  });

  describe('getFromAmount', () => {
    it('returns fromTokenInputValue', () => {
      const state = createBridgeMockStore({}, { fromTokenInputValue: '123' });
      const result = getFromAmount(state as never);

      expect(result).toStrictEqual('123');
    });

    it('returns empty string', () => {
      const state = createBridgeMockStore({}, { fromTokenInputValue: '' });
      const result = getFromAmount(state as never);

      expect(result).toStrictEqual('');
    });
  });

  describe('getToAmount', () => {
    it('returns hardcoded 0', () => {
      const state = createBridgeMockStore();
      const result = getToAmount(state as never);

      expect(result).toStrictEqual('0');
    });
  });
});
