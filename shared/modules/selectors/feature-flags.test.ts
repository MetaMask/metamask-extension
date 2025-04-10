import { RpcEndpointType } from '@metamask/network-controller';
import { CHAIN_IDS } from '../../constants/network';
// Import the module to spy on
import * as featureFlags from '../feature-flags';
import {
  getFeatureFlagsByChainId,
  type SwapsFeatureFlags,
} from './feature-flags';
import { ProviderConfigState } from './networks';

type MockState = ProviderConfigState & {
  metamask: {
    networkConfigurationsByChainId: Record<
      string,
      {
        chainId: string;
        rpcEndpoints: {
          networkClientId: string;
          type: RpcEndpointType;
          url: string;
        }[];
        blockExplorerUrls: string[];
        defaultBlockExplorerUrlIndex: number;
        name: string;
        nativeCurrency: string;
        defaultRpcEndpointIndex: number;
      }
    >;
    selectedNetworkClientId: string;
    networksMetadata: {
      [clientId: string]: { status: string };
    };
    swapsState: {
      swapsFeatureFlags: SwapsFeatureFlags;
    };
  };
};

describe('Feature Flags Selectors', () => {
  const createMockState = (chainId = CHAIN_IDS.MAINNET): MockState => {
    // Use a simpler approach - explicit type cast for test purposes
    return {
      metamask: {
        // Network state for provider config
        networkConfigurationsByChainId: {
          [chainId]: {
            chainId,
            rpcEndpoints: [
              {
                networkClientId: 'test-client-id',
                type: RpcEndpointType.Custom,
                url: 'https://example.com',
              },
            ],
            blockExplorerUrls: ['https://example.com'],
            defaultBlockExplorerUrlIndex: 0,
            name: 'Test Network',
            nativeCurrency: 'ETH',
            defaultRpcEndpointIndex: 0,
          },
        },
        selectedNetworkClientId: 'test-client-id',
        networksMetadata: {
          'test-client-id': { status: 'available' },
        },
        // Swaps feature flags
        swapsState: {
          swapsFeatureFlags: {
            ethereum: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
                extensionReturnTxHashAsap: false,
              },
            },
            bsc: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 60,
                maxDeadline: 180,
                extensionReturnTxHashAsap: true,
              },
            },
            smartTransactions: {
              mobileActive: true,
              extensionActive: true,
              extensionReturnTxHashAsap: false,
            },
          } as SwapsFeatureFlags,
        },
      },
    };
  };

  describe('getFeatureFlagsByChainId', () => {
    beforeEach(() => {
      jest
        .spyOn(featureFlags, 'getNetworkNameByChainId')
        .mockImplementation((chainId: string) => {
          switch (chainId) {
            case CHAIN_IDS.MAINNET:
              return 'ethereum';
            case CHAIN_IDS.BSC:
              return 'bsc';
            case CHAIN_IDS.POLYGON:
              return 'polygon';
            default:
              return '';
          }
        });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns correct feature flags for current chain ID in state', () => {
      const state = createMockState(CHAIN_IDS.MAINNET);
      const result = getFeatureFlagsByChainId(state);

      expect(result).toStrictEqual({
        smartTransactions: {
          mobileActive: true,
          extensionActive: true,
          expectedDeadline: 45,
          maxDeadline: 150,
          extensionReturnTxHashAsap: false,
        },
      });
    });

    it('returns null if chainId is not supported', () => {
      // Instead of using SEPOLIA, create a state with a custom network
      // and mock getNetworkNameByChainId to return empty string
      const state = createMockState(CHAIN_IDS.MAINNET);

      // Mock the implementation for this specific test
      jest
        .spyOn(featureFlags, 'getNetworkNameByChainId')
        .mockReturnValueOnce('');

      const result = getFeatureFlagsByChainId(state);
      expect(result).toBeNull();
    });

    it('prioritizes provided chainId parameter over state chainId', () => {
      // State has Ethereum network, but we're providing BSC chainId
      const state = createMockState(CHAIN_IDS.MAINNET);
      const result = getFeatureFlagsByChainId(state, CHAIN_IDS.BSC);

      expect(result).toStrictEqual({
        smartTransactions: {
          extensionActive: true,
          mobileActive: true,
          expectedDeadline: 60,
          maxDeadline: 180,
          extensionReturnTxHashAsap: true,
        },
      });
    });

    it('falls back to state chainId if provided chainId is falsy', () => {
      const state = createMockState(CHAIN_IDS.MAINNET);
      const result = getFeatureFlagsByChainId(state, '');

      expect(result).toStrictEqual({
        smartTransactions: {
          extensionActive: true,
          mobileActive: true,
          expectedDeadline: 45,
          maxDeadline: 150,
          extensionReturnTxHashAsap: false,
        },
      });
    });
  });
});
