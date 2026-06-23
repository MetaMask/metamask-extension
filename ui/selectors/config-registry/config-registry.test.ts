import type { ConfigRegistryControllerState } from '@metamask/config-registry-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import { FEATURED_RPCS } from '../../../shared/constants/network';
import {
  getRegistryConfigs,
  getIsConfigRegistryApiEnabled,
  getFeaturedEvmNetworks,
} from './config-registry';

/** State shape that satisfies both config-registry and remote feature flag selectors. */
describe('config-registry selectors', () => {
  describe('getRegistryConfigs', () => {
    it('returns registry config from state', () => {
      const state = {
        metamask: {
          configs: { networks: {} },
          lastFetched: null,
          etag: null,
          version: '1.0',
        },
      };
      expect(getRegistryConfigs(state)).toStrictEqual(state.metamask.configs);
    });
  });

  describe('getIsConfigRegistryApiEnabled', () => {
    it('returns true when configRegistryApiEnabled is true', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
        },
      };
      expect(getIsConfigRegistryApiEnabled(state)).toBe(true);
    });

    it('returns false when configRegistryApiEnabled is false', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: false },
        },
      };
      expect(getIsConfigRegistryApiEnabled(state)).toBe(false);
    });

    it('returns false when remoteFeatureFlags is empty', () => {
      const state = {
        metamask: { remoteFeatureFlags: {} },
      };
      expect(getIsConfigRegistryApiEnabled(state)).toBe(false);
    });
  });

  describe('getFeaturedEvmNetworks', () => {
    it('returns FEATURED_RPCS when feature flag is off', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: false },
          configs: { networks: { 'eip155:1': {} as never } },
          lastFetched: null,
          etag: null,
          version: '1.0',
        },
      };
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when configs.networks is empty', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: { networks: {} },
          lastFetched: null,
          etag: null,
          version: '1.0',
        },
      };
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when configs is missing', () => {
      const state: {
        metamask: ConfigRegistryControllerState &
          RemoteFeatureFlagControllerState;
      } = {
        // @ts-expect-error intentionally missing configs
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          lastFetched: null,
          etag: null,
          version: '1.0',
        },
      };
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns dynamic list when flag is on and registry has featured EVM networks', () => {
      const state = {
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
      const result = getFeaturedEvmNetworks(state);
      expect(result).not.toBe(FEATURED_RPCS);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const sei = result.find((n) => n.chainId === '0x531');
      expect(sei).toBeDefined();
      expect(sei?.name).toBe('Sei Network');
      expect(sei?.imageUrl).toBe('https://example.com/sei.png');
    });

    it('omits imageUrl when registry config has non-https imageUrl', () => {
      const state = {
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
      const result = getFeaturedEvmNetworks(state);
      const sei = result.find((n) => n.chainId === '0x531');
      expect(sei).toBeDefined();
      expect(sei?.imageUrl).toBeUndefined();
    });

    it('returns FEATURED_RPCS when registry has only non-EVM featured networks', () => {
      const state = {
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
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when selectFeaturedNetworks returns no featured EVM networks', () => {
      const state = {
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
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when featured EVM network has no default RPC URL', () => {
      const state = {
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
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('skips entries with malformed chainId and falls back to FEATURED_RPCS when no valid entries remain', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'malformed-chain-id': {
                chainId: 'malformed-chain-id',
                name: 'Bad Network',
                rpcProviders: {
                  default: {
                    url: 'https://rpc.example.com',
                    type: 'custom',
                    networkClientId: 'x',
                  },
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
              } as never,
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      expect(() => getFeaturedEvmNetworks(state)).not.toThrow();
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('skips malformed chainId entries but includes valid ones', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              'malformed-chain-id': {
                chainId: 'malformed-chain-id',
                name: 'Bad Network',
                rpcProviders: {
                  default: {
                    url: 'https://rpc.example.com',
                    type: 'custom',
                    networkClientId: 'x',
                  },
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
              } as never,
              'eip155:1329': {
                chainId: 'eip155:1329',
                name: 'Sei Network',
                rpcProviders: {
                  default: {
                    url: 'https://evm-rpc.sei.network',
                    type: 'custom',
                    networkClientId: 'evm-sei-1329',
                  },
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
              } as never,
            },
          },
          version: '1',
          lastFetched: 1,
          etag: null,
        },
      };
      expect(() => getFeaturedEvmNetworks(state)).not.toThrow();
      const result = getFeaturedEvmNetworks(state);
      expect(result).not.toBe(FEATURED_RPCS);
      const sei = result.find((n) => n.chainId === '0x531');
      expect(sei).toBeDefined();
      expect(sei?.name).toBe('Sei Network');
      const bad = result.find((n) => n.name === 'Bad Network');
      expect(bad).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('returns FEATURED_RPCS when featured EVM network has non-https RPC URL', () => {
      const state = {
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
      const result = getFeaturedEvmNetworks(state);
      expect(result).toBe(FEATURED_RPCS);
    });
  });
});
