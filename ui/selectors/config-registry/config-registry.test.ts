import {
  getConfigRegistryState,
  getIsConfigRegistryApiEnabled,
  getFeaturedNetworksForAdditionalList,
} from './config-registry';
import { FEATURED_RPCS } from '../../../shared/constants/network';

describe('config-registry selectors', () => {
  describe('getConfigRegistryState', () => {
    it('returns metamask slice from state', () => {
      const state = {
        metamask: {
          configs: { networks: {} },
          version: '1.0',
        },
      };
      expect(getConfigRegistryState(state)).toBe(state.metamask);
    });

    it('returns undefined when metamask is undefined', () => {
      expect(getConfigRegistryState({} as any)).toBeUndefined();
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

  describe('getFeaturedNetworksForAdditionalList', () => {
    it('returns FEATURED_RPCS when feature flag is off', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: false },
          configs: { networks: { 'eip155:1': {} } },
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state as any);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when configs.networks is empty', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
          configs: { networks: {} },
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state as any);
      expect(result).toBe(FEATURED_RPCS);
    });

    it('returns FEATURED_RPCS when configs is missing', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: { configRegistryApiEnabled: true },
        },
      };
      const result = getFeaturedNetworksForAdditionalList(state as any);
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
      const result = getFeaturedNetworksForAdditionalList(state as any);
      expect(result).not.toBe(FEATURED_RPCS);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const sei = result.find((n) => n.chainId === '0x531');
      expect(sei).toBeDefined();
      expect(sei?.name).toBe('Sei Network');
    });
  });
});
