import { createBridgeMockStore } from '../../../test/jest/mock-store';
import {
  BUILT_IN_NETWORKS,
  CHAIN_IDS,
  FEATURED_RPCS,
} from '../../../shared/constants/network';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
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
  getToTokens,
  getToTopAssets,
} from './selectors';

describe('Bridge selectors', () => {
  describe('getFromChain', () => {
    it('returns the fromChain from the state', () => {
      const state = createBridgeMockStore(
        { srcNetworkAllowlist: [CHAIN_IDS.ARBITRUM] },
        { toChainId: '0xe708' },
        {},
        { ...mockNetworkState(FEATURED_RPCS[0]) },
      );

      const result = getFromChain(state as never);
      expect(result).toStrictEqual({
        blockExplorerUrls: ['https://localhost/blockExplorer/0xa4b1'],
        chainId: '0xa4b1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: expect.anything(),
            type: 'custom',
            url: 'https://localhost/rpc/0xa4b1',
          },
        ],
      });
    });
  });

  describe('getToChain', () => {
    it('returns the toChain from the state', () => {
      const state = createBridgeMockStore(
        { destNetworkAllowlist: ['0xe708'] },
        { toChainId: '0xe708' },
      );

      const result = getToChain(state as never);

      expect(result).toStrictEqual({
        blockExplorerUrls: ['https://localhost/blockExplorer/0xe708'],
        chainId: '0xe708',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Linea Mainnet',
        rpcEndpoints: [
          {
            networkClientId: expect.anything(),
            type: 'custom',
            url: 'https://localhost/rpc/0xe708',
          },
        ],
        nativeCurrency: 'ETH',
      });
    });
  });

  describe('getAllBridgeableNetworks', () => {
    it('returns list of ALLOWED_BRIDGE_CHAIN_IDS networks', () => {
      const state = createBridgeMockStore(
        {},
        {},
        {},
        mockNetworkState(...FEATURED_RPCS),
      );
      const result = getAllBridgeableNetworks(state as never);

      expect(result).toHaveLength(7);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: FEATURED_RPCS[0].chainId }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: FEATURED_RPCS[1].chainId }),
      );
      FEATURED_RPCS.forEach((rpcDefinition, idx) => {
        expect(result[idx]).toStrictEqual(
          expect.objectContaining({
            ...rpcDefinition,
            blockExplorerUrls: [
              `https://localhost/blockExplorer/${rpcDefinition.chainId}`,
            ],
            name: expect.anything(),
            rpcEndpoints: [
              {
                networkClientId: expect.anything(),
                type: 'custom',
                url: `https://localhost/rpc/${rpcDefinition.chainId}`,
              },
            ],
          }),
        );
      });
      result.forEach(({ chainId }) => {
        expect(ALLOWED_BRIDGE_CHAIN_IDS).toContain(chainId);
      });
    });

    it('returns network if included in ALLOWED_BRIDGE_CHAIN_IDS', () => {
      const state = {
        ...createBridgeMockStore(),
        metamask: {
          ...mockNetworkState(
            { chainId: CHAIN_IDS.MAINNET },
            { chainId: CHAIN_IDS.LINEA_MAINNET },
            { chainId: CHAIN_IDS.MOONBEAM },
          ),
        },
      };
      const result = getAllBridgeableNetworks(state as never);

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
      );
      expect(
        result.find(({ chainId }) => chainId === CHAIN_IDS.MOONBEAM),
      ).toStrictEqual(undefined);
    });
  });

  describe('getFromChains', () => {
    it('excludes disabled chains from options', () => {
      const state = createBridgeMockStore(
        {
          srcNetworkAllowlist: [
            CHAIN_IDS.MAINNET,
            CHAIN_IDS.LINEA_MAINNET,
            CHAIN_IDS.OPTIMISM,
            CHAIN_IDS.POLYGON,
          ],
        },
        { toChainId: CHAIN_IDS.LINEA_MAINNET },
      );
      const result = getFromChains(state as never);

      expect(result).toHaveLength(2);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.MAINNET }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
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
      const state = createBridgeMockStore(
        {
          destNetworkAllowlist: [
            CHAIN_IDS.ARBITRUM,
            CHAIN_IDS.LINEA_MAINNET,
            CHAIN_IDS.OPTIMISM,
            CHAIN_IDS.POLYGON,
          ],
        },
        {},
        {},
        mockNetworkState(...FEATURED_RPCS, {
          chainId: CHAIN_IDS.LINEA_MAINNET,
        }),
      );
      const result = getToChains(state as never);

      expect(result).toHaveLength(3);
      expect(result[0]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.OPTIMISM }),
      );
      expect(result[1]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.POLYGON }),
      );
      expect(result[2]).toStrictEqual(
        expect.objectContaining({ chainId: CHAIN_IDS.LINEA_MAINNET }),
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
      const state = createBridgeMockStore(
        {
          extensionSupport: false,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x38'],
        },
        { toChainId: '0x38' },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: true },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if toChainId is null', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x1'],
        },
        { toChainId: null },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: true },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if fromChain and toChainId have the same chainId', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x1'],
        },
        { toChainId: '0x1' },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: true },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns false if useExternalServices is not enabled', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x38'],
        },
        { toChainId: '0x38' },
        {},
        { ...mockNetworkState({ chainId: '0x1' }), useExternalServices: false },
      );

      const result = getIsBridgeTx(state as never);

      expect(result).toBe(false);
    });

    it('returns true if bridge is enabled and fromChain and toChainId have different chainIds', () => {
      const state = createBridgeMockStore(
        {
          extensionSupport: true,
          srcNetworkAllowlist: ['0x1'],
          destNetworkAllowlist: ['0x38'],
        },
        { toChainId: '0x38' },
        {},
        {
          ...mockNetworkState(
            ...Object.values(BUILT_IN_NETWORKS),
            ...FEATURED_RPCS,
          ),
          useExternalServices: true,
        },
      );

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

  describe('getToTokens', () => {
    it('returns dest tokens from controller state when toChainId is defined', () => {
      const state = createBridgeMockStore(
        {},
        { toChainId: '0x1' },
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
        },
      );
      const result = getToTokens(state as never);

      expect(result).toStrictEqual({
        '0x00': { address: '0x00', symbol: 'TEST' },
      });
    });

    it('returns empty dest tokens from controller state when toChainId is undefined', () => {
      const state = createBridgeMockStore(
        {},
        {},
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
        },
      );
      const result = getToTokens(state as never);

      expect(result).toStrictEqual({});
    });
  });

  describe('getToTopAssets', () => {
    it('returns dest top assets from controller state when toChainId is defined', () => {
      const state = createBridgeMockStore(
        {},
        { toChainId: '0x1' },
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          destTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
      );
      const result = getToTopAssets(state as never);

      expect(result).toStrictEqual([{ address: '0x00', symbol: 'TEST' }]);
    });

    it('returns empty dest top assets from controller state when toChainId is undefined', () => {
      const state = createBridgeMockStore(
        {},
        {},
        {
          destTokens: { '0x00': { address: '0x00', symbol: 'TEST' } },
          destTopAssets: [{ address: '0x00', symbol: 'TEST' }],
        },
      );
      const result = getToTopAssets(state as never);

      expect(result).toStrictEqual([]);
    });
  });
});
