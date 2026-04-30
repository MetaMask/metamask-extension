import { RpcEndpointType } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../constants/network';
// Import the module to spy on
import * as featureFlags from '../feature-flags';
import {
  getFeatureFlagsByChainId,
  type SwapsFeatureFlags,
  type SmartTransactionsNetworks,
  type FeatureFlagsMetaMaskState,
} from './feature-flags';
import { ProviderConfigState } from './networks';

type MockState = ProviderConfigState &
  FeatureFlagsMetaMaskState & {
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
      remoteFeatureFlags?: {
        smartTransactionsNetworks?: SmartTransactionsNetworks;
      };
    };
  };

describe('Feature Flags Selectors', () => {
  const createMockState = (
    chainId: Hex = CHAIN_IDS.MAINNET,
    remoteFeatureFlagsOverride?: {
      smartTransactionsNetworks?: SmartTransactionsNetworks;
    },
  ): MockState => {
    const state: MockState = {
      metamask: {
        networkConfigurationsByChainId: {
          [chainId]: {
            chainId: chainId as Hex,
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
        swapsState: {
          swapsFeatureFlags: {
            ethereum: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 45,
                maxDeadline: 150,
              },
            },
            bsc: {
              extensionActive: true,
              mobileActive: false,
              smartTransactions: {
                expectedDeadline: 60,
                maxDeadline: 180,
              },
            },
            smartTransactions: {
              mobileActive: true,
              extensionActive: true,
              extensionReturnTxHashAsap: false,
            },
          } as SwapsFeatureFlags,
        },
        remoteFeatureFlags: remoteFeatureFlagsOverride
          ? {
              smartTransactionsNetworks: {
                default: {
                  batchStatusPollingInterval: 1000,
                  extensionActive: true,
                  extensionReturnTxHashAsap: true,
                  extensionReturnTxHashAsapBatch: true,
                  extensionSkipSmartTransactionStatusPage: false,
                },
                ...remoteFeatureFlagsOverride.smartTransactionsNetworks,
              },
            }
          : undefined,
      },
    };
    return state;
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
          extensionReturnTxHashAsapBatch: false,
          extensionSkipSmartTransactionStatusPage: false,
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
          extensionReturnTxHashAsap: false,
          extensionReturnTxHashAsapBatch: false,
          extensionSkipSmartTransactionStatusPage: false,
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
          extensionReturnTxHashAsapBatch: false,
          extensionSkipSmartTransactionStatusPage: false,
        },
      });
    });

    describe('remote feature flags', () => {
      it('uses extensionReturnTxHashAsap from remote flags when available', () => {
        const state = createMockState(CHAIN_IDS.MAINNET, {
          smartTransactionsNetworks: {},
        });
        const result = getFeatureFlagsByChainId(state);

        expect(result).toStrictEqual({
          smartTransactions: {
            mobileActive: true,
            extensionActive: true,
            expectedDeadline: 45,
            maxDeadline: 150,
            extensionReturnTxHashAsap: true,
            extensionReturnTxHashAsapBatch: true,
            extensionSkipSmartTransactionStatusPage: false,
          },
        });
      });

      it('defaults to false when remote flags are not available', () => {
        const state = createMockState(CHAIN_IDS.MAINNET);
        const result = getFeatureFlagsByChainId(state);

        expect(result).toStrictEqual({
          smartTransactions: {
            mobileActive: true,
            extensionActive: true,
            expectedDeadline: 45,
            maxDeadline: 150,
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipSmartTransactionStatusPage: false,
          },
        });
      });

      it('uses default remote flag value for all networks', () => {
        const state = createMockState(CHAIN_IDS.BSC, {
          smartTransactionsNetworks: {},
        });
        const result = getFeatureFlagsByChainId(state);

        expect(result).toStrictEqual({
          smartTransactions: {
            extensionActive: true,
            mobileActive: true,
            expectedDeadline: 60,
            maxDeadline: 180,
            extensionReturnTxHashAsap: true,
            extensionReturnTxHashAsapBatch: true,
            extensionSkipSmartTransactionStatusPage: false,
          },
        });
      });

      it('uses extensionSkipSmartTransactionStatusPage from network specific remote flags and override default when available', () => {
        const state = createMockState(CHAIN_IDS.BSC, {
          smartTransactionsNetworks: {
            [CHAIN_IDS.BSC]: {
              extensionSkipSmartTransactionStatusPage: true,
            },
            default: {
              batchStatusPollingInterval: 1000,
              extensionActive: true,
              extensionReturnTxHashAsap: true,
              extensionReturnTxHashAsapBatch: true,
              extensionSkipSmartTransactionStatusPage: false,
            },
          },
        });

        const result = getFeatureFlagsByChainId(state);
        expect(result).toStrictEqual({
          smartTransactions: {
            extensionActive: true,
            mobileActive: true,
            expectedDeadline: 60,
            maxDeadline: 180,
            extensionReturnTxHashAsap: true,
            extensionReturnTxHashAsapBatch: true,
            extensionSkipSmartTransactionStatusPage: true,
          },
        });
      });
    });
  });
});
