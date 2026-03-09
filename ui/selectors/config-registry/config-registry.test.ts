import type { RemoteFeatureFlagsState } from '../remote-feature-flags';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import {
  getConfigRegistryState,
  getIsConfigRegistryApiEnabled,
  getFeaturedNetworksForAdditionalList,
  type StateWithConfigRegistry,
} from './config-registry';

/** State shape that satisfies both config-registry and remote feature flag selectors. */
type ConfigRegistryTestState = StateWithConfigRegistry &
  RemoteFeatureFlagsState;

describe('config-registry selectors', () => {
  describe('getConfigRegistryState', () => {
    it('returns metamask slice from state', () => {
      const state: StateWithConfigRegistry = {
        metamask: {
          configs: { networks: {} },
          version: '1.0',
        },
      };
      expect(getConfigRegistryState(state)).toBe(state.metamask);
    });

    it('returns undefined when metamask is undefined', () => {
      const state: StateWithConfigRegistry = {};
      expect(getConfigRegistryState(state)).toBeUndefined();
    });
  });

  describe('getIsConfigRegistryApiEnabled', () => {
    it('returns true when configRegistryApiEnabled is true', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
        },
      };
      expect(getIsConfigRegistryApiEnabled(state)).toBe(true);
    });

    it('returns false when configRegistryApiEnabled is false', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: false },
        },
      };
      expect(getIsConfigRegistryApiEnabled(state)).toBe(false);
    });

    it('returns false when remoteFeatureFlags is empty', () => {
      const state: ConfigRegistryTestState = {
        metamask: { remoteFeatureFlags: {} },
      };
      expect(getIsConfigRegistryApiEnabled(state)).toBe(false);
    });
  });

  describe('getFeaturedNetworksForAdditionalList', () => {
    it('returns FEATURED_RPCS when feature flag is off', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: false },
          configs: { networks: { 'eip155:1': {} as never } },
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when configs.networks is empty', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: { networks: {} },
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when configs is missing', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns dynamic list when flag is on and registry has featured EVM networks', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'eip155:1329': {
                chainId: 'eip155:1329',
                name: 'Sei Network',
                imageUrl: 'https://example.com/sei.png',
                coingeckoPlatformId: 'sei-network',
                assets: {
                  listUrl: '',
                  native: {
                    assetId: 'eip155:1329',
                    imageUrl: '',
                    name: 'Sei',
                    symbol: 'SEI',
                    decimals: 18,
                    coingeckoCoinId: 'sei-network',
                  },
                },
                rpcProviders: {
                  default: {
                    url: 'https://evm-rpc.sei.network',
                    type: 'custom',
                    networkClientId: 'evm-sei-1329',
                  },
                  fallbacks: [],
                },
                blockExplorerUrls: {
                  default: 'https://seitrace.com',
                  fallbacks: [],
                },
                config: {
                  isActive: true,
                  isTestnet: false,
                  isDefault: false,
                  isFeatured: true,
                  isDeprecated: false,
                  isDeletable: false,
                  priority: 0,
                },
              },
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).not.toBe(FEATURED_RPCS);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const sei = result.find((n) => n.chainId === '0x531');
      expect(sei).toBeDefined();
      expect(sei?.name).toBe('Sei Network');
      expect(sei?.imageUrl).toBe('https://example.com/sei.png');
    });

    it('omits imageUrl when registry config has non-https imageUrl', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'eip155:1329': {
                chainId: 'eip155:1329',
                name: 'Sei Network',
                imageUrl: 'http://example.com/sei.png',
                coingeckoPlatformId: 'sei-network',
                assets: {
                  listUrl: '',
                  native: {
                    assetId: 'eip155:1329',
                    imageUrl: '',
                    name: 'Sei',
                    symbol: 'SEI',
                    decimals: 18,
                    coingeckoCoinId: 'sei-network',
                  },
                },
                rpcProviders: {
                  default: {
                    url: 'https://evm-rpc.sei.network',
                    type: 'custom',
                    networkClientId: 'evm-sei-1329',
                  },
                  fallbacks: [],
                },
                blockExplorerUrls: {
                  default: 'https://seitrace.com',
                  fallbacks: [],
                },
                config: {
                  isActive: true,
                  isTestnet: false,
                  isDefault: false,
                  isFeatured: true,
                  isDeprecated: false,
                  isDeletable: false,
                  priority: 0,
                },
              },
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      const sei = result.find((n) => n.chainId === '0x531');
      expect(sei).toBeDefined();
      expect(sei?.imageUrl).toBeUndefined();
    });

    it('returns FEATURED_RPCS when registry has only non-EVM featured networks', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'solana:5eykt4': {
                chainId: 'solana:5eykt4',
                name: 'Solana Mainnet',
                imageUrl: 'https://example.com/solana.png',
                assets: {
                  native: { symbol: 'SOL', decimals: 9 },
                },
                rpcProviders: {
                  default: { url: 'https://api.mainnet-beta.solana.com' },
                  fallbacks: [],
                },
                config: { isFeatured: true },
              } as never,
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when selectFeaturedNetworks returns no featured EVM networks', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'eip155:1': {
                chainId: 'eip155:1',
                name: 'Ethereum',
                rpcProviders: {
                  default: { url: 'https://eth.llamarpc.com' },
                  fallbacks: [],
                },
                config: {
                  isActive: true,
                  isTestnet: false,
                  isDefault: true,
                  isFeatured: false,
                  isDeprecated: false,
                  isDeletable: false,
                  priority: 0,
                },
              } as never,
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when featured EVM network has no default RPC URL', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'eip155:999': {
                chainId: 'eip155:999',
                name: 'Testnet No RPC',
                rpcProviders: {
                  default: { url: '', type: 'custom', networkClientId: 'x' },
                  fallbacks: [],
                },
                config: {
                  isActive: true,
                  isTestnet: true,
                  isDefault: false,
                  isFeatured: true,
                  isDeprecated: false,
                  isDeletable: false,
                  priority: 0,
                },
              } as never,
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when featured EVM network has non-https RPC URL', () => {
      const state: ConfigRegistryTestState = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'eip155:888': {
                chainId: 'eip155:888',
                name: 'Testnet HTTP RPC',
                rpcProviders: {
                  default: {
                    url: 'http://rpc.example.com',
                    type: 'custom',
                    networkClientId: 'x',
                  },
                  fallbacks: [],
                },
                config: {
                  isActive: true,
                  isTestnet: true,
                  isDefault: false,
                  isFeatured: true,
                  isDeprecated: false,
                  isDeletable: false,
                  priority: 0,
                },
              } as never,
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state);
      expect(result).toBe(FEATURED_RPCS);
    });
  });
});
