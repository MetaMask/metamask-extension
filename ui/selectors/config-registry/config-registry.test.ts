import type {
  ConfigRegistryControllerState,
  RegistryNetworkConfig,
} from '@metamask/config-registry-controller';
import type { RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';
import {
  FEATURED_RPCS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_IDS,
} from '../../../shared/constants/network';
import {
  getRegistryConfigs,
  getIsConfigRegistryApiEnabled,
  getFeaturedEvmNetworks,
  getChainIdToNetworkImageUrlMap,
  getChainIdToNativeTokenImageUrlMap,
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
      const registryNetwork: RegistryNetworkConfig = {
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
      };
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              [registryNetwork.chainId]: registryNetwork,
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
      const registryNetwork: RegistryNetworkConfig = {
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
      };

      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: {
            networks: {
              [registryNetwork.chainId]: registryNetwork,
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

  describe('getChainIdToNetworkImageUrlMap', () => {
    const buildState = (
      networks: Record<string, RegistryNetworkConfig | never>,
      enabled = true,
    ) => ({
      metamask: {
        remoteFeatureFlags: { configRegistryApiEnabled: enabled },
        configs: { networks },
        lastFetched: null,
        etag: null,
        version: '1.0',
      },
    });

    it('returns the static maps when the feature flag is off', () => {
      const state = buildState(
        { 'eip155:1329': { imageUrl: 'https://x.png' } as never },
        false,
      );
      const result = getChainIdToNetworkImageUrlMap(state);
      expect(result['0x1']).toBe(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x1']);
      expect(result['eip155:1329']).toBeUndefined();
      expect(result['0x531']).toBe(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x531']);
    });

    it('layers registry image URLs over the static map keyed by hex chain ID', () => {
      const state = buildState({
        'eip155:1329': {
          chainId: 'eip155:1329',
          imageUrl: 'https://example.com/sei.png',
        } as never,
      });
      const result = getChainIdToNetworkImageUrlMap(state);
      expect(result['0x531']).toBe('https://example.com/sei.png');
      // static entries are preserved
      expect(result['0x1']).toBe(CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP['0x1']);
    });

    it('overrides a static entry when the registry provides an imageUrl', () => {
      const state = buildState({
        'eip155:1': {
          chainId: 'eip155:1',
          imageUrl: 'https://example.com/eth.png',
        } as never,
      });
      expect(getChainIdToNetworkImageUrlMap(state)['0x1']).toBe(
        'https://example.com/eth.png',
      );
    });

    it('skips non-https image URLs and includes non-EVM chains under CAIP keys', () => {
      const state = buildState({
        'eip155:9999': {
          chainId: 'eip155:9999',
          imageUrl: 'http://insecure.example.com/sei.png',
        } as never,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          imageUrl: 'https://example.com/sol.png',
        } as never,
      });
      const result = getChainIdToNetworkImageUrlMap(state);
      expect(result['0x270f']).toBeUndefined();
      expect(result['eip155:9999']).toBeUndefined();
      expect(result['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp']).toBe(
        'https://example.com/sol.png',
      );
    });

    it('keys EVM registry entries by both hex and CAIP chain ID', () => {
      const state = buildState({
        'eip155:1329': {
          chainId: 'eip155:1329',
          imageUrl: 'https://example.com/sei.png',
        } as never,
      });
      const result = getChainIdToNetworkImageUrlMap(state);
      expect(result['0x531']).toBe('https://example.com/sei.png');
      expect(result['eip155:1329']).toBe('https://example.com/sei.png');
    });
  });

  describe('getChainIdToNativeTokenImageUrlMap', () => {
    const buildState = (
      networks: Record<string, RegistryNetworkConfig | never>,
      enabled = true,
    ) => ({
      metamask: {
        remoteFeatureFlags: { configRegistryApiEnabled: enabled },
        configs: { networks },
        lastFetched: null,
        etag: null,
        version: '1.0',
      },
    });

    it('returns the static token map when the feature flag is off', () => {
      const state = buildState(
        {
          'eip155:1329': {
            assets: { native: { imageUrl: 'https://x.png' } },
          } as never,
        },
        false,
      );
      const result = getChainIdToNativeTokenImageUrlMap(state);
      expect(result).toBe(CHAIN_ID_TOKEN_IMAGE_MAP);
    });

    it('layers registry assets.native image URLs over the static token map', () => {
      const state = buildState({
        'eip155:99901': {
          chainId: 'eip155:99901',
          assets: {
            native: { imageUrl: 'https://example.com/native.png' },
          },
        } as never,
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          assets: {
            native: { imageUrl: 'https://example.com/sol-native.png' },
          },
        } as never,
      });
      const result = getChainIdToNativeTokenImageUrlMap(state);
      expect(result['0x1863d']).toBe('https://example.com/native.png');
      expect(result['eip155:99901']).toBe('https://example.com/native.png');
      expect(result['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp']).toBe(
        'https://example.com/sol-native.png',
      );
      // static entries are preserved
      expect(result[CHAIN_IDS.MAINNET]).toBe(
        CHAIN_ID_TOKEN_IMAGE_MAP[CHAIN_IDS.MAINNET],
      );
    });

    it('skips chains whose native asset has no valid https image URL', () => {
      const state = buildState({
        'eip155:9999': {
          chainId: 'eip155:9999',
          assets: { native: { imageUrl: 'http://insecure.example.com/x.png' } },
        } as never,
        'eip155:9998': {
          chainId: 'eip155:9998',
          assets: {},
        } as never,
      });
      const result = getChainIdToNativeTokenImageUrlMap(state);
      expect(result['0x270f']).toBeUndefined();
      expect(result['0x270e']).toBeUndefined();
    });
  });
});
