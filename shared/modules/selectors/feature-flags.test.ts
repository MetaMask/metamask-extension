import { CHAIN_IDS } from '../../constants/network';
import { getFeatureFlagsByChainId } from './feature-flags';

// Mock the feature flags module
jest.mock('../feature-flags', () => ({
  getNetworkNameByChainId: (chainId: string) => {
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
  },
}));

describe('Feature Flags Selectors', () => {
  const createMockState = (chainId = CHAIN_IDS.MAINNET) => {
    // Use a simpler approach - explicit type cast for test purposes
    return {
      metamask: {
        // Network state for provider config
        networkConfigurationsByChainId: {
          [chainId]: {
            chainId,
            rpcEndpoints: [{ networkClientId: 'test-client-id' }],
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
              extensionActive: true,
              mobileActive: false,
            },
          },
        },
      },
    } as any; // Cast to any for test purposes
  };

  describe('getFeatureFlagsByChainId', () => {
    it('returns correct feature flags for current chain ID in state', () => {
      const state = createMockState(CHAIN_IDS.MAINNET);
      const result = getFeatureFlagsByChainId(state);

      expect(result).toEqual({
        smartTransactions: {
          extensionActive: true,
          mobileActive: false,
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

      const mockModule = jest.requireMock('../feature-flags');
      const originalFn = mockModule.getNetworkNameByChainId;
      mockModule.getNetworkNameByChainId = jest.fn().mockReturnValue('');

      const result = getFeatureFlagsByChainId(state);
      expect(result).toBeNull();

      // Restore original mock
      mockModule.getNetworkNameByChainId = originalFn;
    });

    it('prioritizes provided chainId parameter over state chainId', () => {
      // State has Ethereum network, but we're providing BSC chainId
      const state = createMockState(CHAIN_IDS.MAINNET);
      const result = getFeatureFlagsByChainId(state, CHAIN_IDS.BSC);

      expect(result).toEqual({
        smartTransactions: {
          extensionActive: true,
          mobileActive: false,
          expectedDeadline: 60,
          maxDeadline: 180,
          extensionReturnTxHashAsap: true,
        },
      });
    });

    it('falls back to state chainId if provided chainId is falsy', () => {
      const state = createMockState(CHAIN_IDS.MAINNET);
      const result = getFeatureFlagsByChainId(state, '');

      expect(result).toEqual({
        smartTransactions: {
          extensionActive: true,
          mobileActive: false,
          expectedDeadline: 45,
          maxDeadline: 150,
          extensionReturnTxHashAsap: false,
        },
      });
    });
  });
});
