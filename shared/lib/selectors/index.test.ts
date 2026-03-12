// Mocha type definitions are conflicting with Jest
import { it as jestIt } from '@jest/globals';

import { createSwapsMockStore } from '../../../test/jest';
import { CHAIN_IDS } from '../../constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import * as envModule from '../environment';
import {
  getSmartTransactionsOptInStatusForMetrics,
  getChainSupportsSmartTransactions,
  getSmartTransactionsEnabled,
  getIsSmartTransaction,
  getSmartTransactionsPreferenceEnabled,
  getSmartTransactionsFeatureFlagsForChain,
} from '.';

describe('Selectors', () => {
  const createMockState = () => {
    return {
      metamask: {
        preferences: {
          smartTransactionsOptInStatus: true,
        },
        internalAccounts: {
          selectedAccount: 'account1',
          accounts: {
            account1: {
              metadata: {
                keyring: {
                  type: 'Hardware',
                },
              },
              address: '0x123',
              type: 'eip155:eoa',
            },
          },
        },
        accounts: {
          '0x123': {
            address: '0x123',
            balance: '0x15f6f0b9d4f8d000',
          },
        },
        remoteFeatureFlags: {
          smartTransactionsNetworks: {
            default: {
              extensionActive: true,
            },
            [CHAIN_IDS.MAINNET]: {
              extensionActive: true,
              expectedDeadline: 45,
              maxDeadline: 150,
              extensionReturnTxHashAsap: false,
              extensionReturnTxHashAsapBatch: false,
              extensionSkipSmartTransactionStatusPage: false,
              batchStatusPollingInterval: 1000,
            },
          },
        },
        smartTransactionsState: {
          liveness: true,
          livenessByChainId: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.BSC]: true,
            [CHAIN_IDS.SEPOLIA]: true,
            [CHAIN_IDS.LINEA_MAINNET]: true,
          },
        },
        ...mockNetworkState({
          id: 'network-configuration-id-1',
          chainId: CHAIN_IDS.MAINNET,
          rpcUrl: 'https://mainnet.infura.io/v3/',
        }),
      },
    };
  };

  describe('getSmartTransactionsOptInStatusForMetrics and getSmartTransactionsPreferenceEnabled', () => {
    const createMockOptInStatusState = (status: boolean) => {
      return {
        metamask: {
          preferences: {
            smartTransactionsOptInStatus: status,
          },
        },
      };
    };
    describe('getSmartTransactionsOptInStatusForMetrics', () => {
      jestIt('should return the smart transactions opt-in status', () => {
        const state = createMockState();
        const result = getSmartTransactionsOptInStatusForMetrics(state);
        expect(result).toBe(true);
      });

      jestIt.each([
        { status: true, expected: true },
        { status: false, expected: false },
      ])(
        'should return $expected if the smart transactions opt-in status is $status',
        ({ status, expected }) => {
          const state = createMockOptInStatusState(status);
          const result = getSmartTransactionsOptInStatusForMetrics(state);
          expect(result).toBe(expected);
        },
      );
    });

    describe('getSmartTransactionsPreferenceEnabled', () => {
      jestIt(
        'should return the smart transactions preference enabled status',
        () => {
          const state = createMockState();
          const result = getSmartTransactionsPreferenceEnabled(state);
          expect(result).toBe(true);
        },
      );

      jestIt.each([
        { status: true, expected: true },
        { status: false, expected: false },
      ])(
        'should return $expected if the smart transactions opt-in status is $status',
        ({ status, expected }) => {
          const state = createMockOptInStatusState(status);
          const result = getSmartTransactionsPreferenceEnabled(state);
          expect(result).toBe(expected);
        },
      );
    });
  });

  describe('getChainSupportsSmartTransactions', () => {
    jestIt(
      'should return true if the chain ID is allowed for smart transactions',
      () => {
        const state = createMockState();
        const result = getChainSupportsSmartTransactions(state);
        expect(result).toBe(true);
      },
    );

    jestIt(
      'should return false if the chain ID is not allowed for smart transactions',
      () => {
        const state = createMockState();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
          },
        };
        const result = getChainSupportsSmartTransactions(newState);
        expect(result).toBe(false);
      },
    );

    jestIt(
      'should prioritize provided chainId parameter over state chainId',
      () => {
        const state = createMockState(); // Has allowed chain ID
        // Should be false for non-allowed chain ID regardless of state
        expect(
          getChainSupportsSmartTransactions(state, CHAIN_IDS.OPTIMISM),
        ).toBe(false);

        const nonSupportedState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
          },
        };
        // Should be true for allowed chain ID regardless of state
        expect(
          getChainSupportsSmartTransactions(
            nonSupportedState,
            CHAIN_IDS.MAINNET,
          ),
        ).toBe(true);
      },
    );
  });

  describe('getSmartTransactionsEnabled', () => {
    jestIt(
      'returns true if feature flag is enabled, not a HW and is Ethereum network',
      () => {
        const state = createSwapsMockStore();
        expect(getSmartTransactionsEnabled(state)).toBe(true);
      },
    );

    jestIt(
      'returns false if feature flag is disabled, not a HW and is Ethereum network',
      () => {
        const state = createSwapsMockStore();
        state.metamask.remoteFeatureFlags.smartTransactionsNetworks[
          CHAIN_IDS.MAINNET
        ] = { extensionActive: false };
        expect(getSmartTransactionsEnabled(state)).toBe(false);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW, STX liveness is false for chain',
      () => {
        const state = createSwapsMockStore();
        state.metamask.smartTransactionsState.livenessByChainId[
          CHAIN_IDS.MAINNET
        ] = false;
        expect(getSmartTransactionsEnabled(state)).toBe(false);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW, STX liveness is not set for chain',
      () => {
        const state = createSwapsMockStore();
        // @ts-expect-error Testing undefined liveness for chain
        state.metamask.smartTransactionsState.livenessByChainId = {};
        expect(getSmartTransactionsEnabled(state)).toBe(false);
      },
    );

    jestIt(
      'returns true if feature flag is enabled, is a HW and is Ethereum network',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            internalAccounts: {
              ...state.metamask.internalAccounts,
              selectedAccount: 'account2',
              accounts: {
                account2: {
                  metadata: {
                    keyring: {
                      type: 'Trezor Hardware',
                    },
                  },
                },
              },
            },
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(true);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW and is Optimism network',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.OPTIMISM }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(false);
      },
    );

    jestIt(
      'returns true if feature flag is enabled, not a HW and is BSC network with a default RPC URL',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.BSC,
              rpcUrl: 'https://bsc-dataseed.binance.org/',
            }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(true);
      },
    );

    jestIt(
      'returns false if feature flag is disabled for BSC, not a HW and is BSC network with a default RPC URL',
      () => {
        const state = createSwapsMockStore();
        state.metamask.remoteFeatureFlags.smartTransactionsNetworks[
          CHAIN_IDS.BSC
        ] = { extensionActive: false };
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.BSC,
              rpcUrl: 'https://bsc-dataseed.binance.org/',
            }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(false);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW and is BSC network with a non-default RPC URL',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.BSC,
              rpcUrl: 'https://bsc-dataseed1.defibit.io/',
            }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(false);
      },
    );

    jestIt(
      'returns true if feature flag is enabled, not a HW and is Linea network with a default RPC URL',
      () => {
        const state = createSwapsMockStore();
        (
          state.metamask.remoteFeatureFlags.smartTransactionsNetworks as Record<
            string,
            { extensionActive: boolean }
          >
        )[CHAIN_IDS.LINEA_MAINNET] = {
          extensionActive: true,
        };
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.LINEA_MAINNET,
              rpcUrl: 'https://linea-mainnet.infura.io/v3/test-project-id',
            }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(true);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW and is Linea network with a non-default RPC URL',
      () => {
        const state = createSwapsMockStore();
        (
          state.metamask.remoteFeatureFlags.smartTransactionsNetworks as Record<
            string,
            { extensionActive: boolean }
          >
        )[CHAIN_IDS.LINEA_MAINNET] = {
          extensionActive: true,
        };
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.LINEA_MAINNET,
              rpcUrl: 'https://rpc.linea.build/',
            }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(false);
      },
    );

    jestIt('returns false if a snap account is used', () => {
      const state = createSwapsMockStore();
      state.metamask.internalAccounts.selectedAccount =
        '36eb02e0-7925-47f0-859f-076608f09b69';
      expect(getSmartTransactionsEnabled(state)).toBe(false);
    });

    jestIt('prioritizes provided chainId parameter over state chainId', () => {
      const state = createSwapsMockStore(); // Ethereum network (supported)

      // Should be false for Optimism chainId regardless of state
      expect(getSmartTransactionsEnabled(state, CHAIN_IDS.OPTIMISM)).toBe(
        false,
      );

      // Should be true for BSC chainId (supported) regardless of state
      const optimismState = {
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            {
              chainId: CHAIN_IDS.BSC,
              rpcUrl: 'https://bsc-dataseed.binance.org/',
            },
          ),
        },
      };
      expect(getSmartTransactionsEnabled(optimismState, CHAIN_IDS.BSC)).toBe(
        true,
      );
    });

    // RPC URL checking tests
    jestIt('permits Infura URLs in production for RPC URL checks', () => {
      jest.spyOn(envModule, 'isProduction').mockReturnValue(true);

      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.MAINNET,
            rpcUrl: 'https://mainnet.infura.io/v3/some-project-id',
          }),
        },
      };

      expect(getSmartTransactionsEnabled(newState)).toBe(true);
    });

    jestIt('permits Binance URLs in production for RPC URL checks', () => {
      jest.spyOn(envModule, 'isProduction').mockReturnValue(true);

      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.BSC,
            rpcUrl: 'https://bsc-dataseed.binance.org/',
          }),
        },
      };

      expect(getSmartTransactionsEnabled(newState)).toBe(true);
    });

    jestIt('rejects other URLs in production for RPC URL checks', () => {
      jest.spyOn(envModule, 'isProduction').mockReturnValue(true);

      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.BSC,
            rpcUrl: 'https://bsc-dataseed1.defibit.io/',
          }),
        },
      };

      expect(getSmartTransactionsEnabled(newState)).toBe(false);
    });

    jestIt('allows any URL in non-production for RPC URL checks', () => {
      jest.spyOn(envModule, 'isProduction').mockReturnValue(false);

      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState({
            chainId: CHAIN_IDS.BSC,
            rpcUrl: 'https://some-random-rpc.example.com',
          }),
        },
      };

      expect(getSmartTransactionsEnabled(newState)).toBe(true);
    });

    jestIt(
      'prioritizes provided chainId parameter over state chainId for RPC URL checks',
      () => {
        jest.spyOn(envModule, 'isProduction').mockReturnValue(false);

        // Set up a state with a chain ID that should be skipped, but a non-acceptable RPC URL
        const state = createSwapsMockStore();
        const stateWithCustomRpc = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({
              chainId: CHAIN_IDS.MAINNET,
              rpcUrl: 'https://some-random-rpc.example.com',
            }),
          },
        };

        // When we pass CHAIN_IDS.BSC which is in the skip list, it should work
        // regardless of the RPC URL in the state
        expect(
          getSmartTransactionsEnabled(stateWithCustomRpc, CHAIN_IDS.BSC),
        ).toBe(true);
      },
    );
  });

  describe('getIsSmartTransaction', () => {
    jestIt(
      'should return true if smart transactions are opt-in and enabled',
      () => {
        const state = createMockState();
        const result = getIsSmartTransaction(state);
        expect(result).toBe(true);
      },
    );

    jestIt('should return false if smart transactions are not opt-in', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          preferences: {
            ...state.metamask.preferences,
            smartTransactionsOptInStatus: false,
          },
        },
      };
      const result = getIsSmartTransaction(newState);
      expect(result).toBe(false);
    });

    jestIt('should return false if smart transactions are not enabled', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          remoteFeatureFlags: {
            ...state.metamask.remoteFeatureFlags,
            smartTransactionsNetworks: {
              ...state.metamask.remoteFeatureFlags.smartTransactionsNetworks,
              [CHAIN_IDS.MAINNET]: {
                extensionActive: false,
                mobileActive: false,
              },
            },
          },
        },
      };
      const result = getIsSmartTransaction(newState);
      expect(result).toBe(false);
    });

    jestIt('prioritizes provided chainId parameter over state chainId', () => {
      const state = createMockState(); // Has enabled smart transactions

      // Should be false for non-supported chain ID despite state supporting it
      expect(getIsSmartTransaction(state, CHAIN_IDS.OPTIMISM)).toBe(false);

      // Create a state with Optimism (non-supported) chain ID
      const nonSupportedState = {
        ...state,
        metamask: {
          ...state.metamask,
          ...mockNetworkState(
            { chainId: CHAIN_IDS.OPTIMISM },
            {
              chainId: CHAIN_IDS.MAINNET,
              rpcUrl: 'https://mainnet.infura.io/v3/',
            },
          ),
        },
      };

      // Should be true for supported chain ID despite state not supporting it
      expect(getIsSmartTransaction(nonSupportedState, CHAIN_IDS.MAINNET)).toBe(
        true,
      );
    });
  });

  describe('getSmartTransactionsFeatureFlagsForChain', () => {
    const createStateWithFeatureFlags = (
      smartTransactionsNetworks: Record<string, unknown>,
    ) => ({
      metamask: {
        remoteFeatureFlags: {
          smartTransactionsNetworks,
        },
      },
    });

    jestIt(
      'should return merged config with default and chain-specific values',
      () => {
        const state = createStateWithFeatureFlags({
          default: {
            extensionActive: true,
            expectedDeadline: 45,
            maxDeadline: 150,
          },
          [CHAIN_IDS.MAINNET]: {
            extensionActive: true,
            expectedDeadline: 30,
          },
        });

        const result = getSmartTransactionsFeatureFlagsForChain(
          state,
          CHAIN_IDS.MAINNET,
        );

        // Chain-specific expectedDeadline should override default
        expect(result.expectedDeadline).toBe(30);
        // Default maxDeadline should be used since not specified for chain
        expect(result.maxDeadline).toBe(150);
        expect(result.extensionActive).toBe(true);
      },
    );

    jestIt('should return default config when chain is not configured', () => {
      const state = createStateWithFeatureFlags({
        default: {
          extensionActive: true,
          expectedDeadline: 45,
          maxDeadline: 150,
        },
        [CHAIN_IDS.MAINNET]: {
          extensionActive: true,
        },
      });

      // Use OPTIMISM (not in allowed STX chain IDs) to test unconfigured chain behavior
      const result = getSmartTransactionsFeatureFlagsForChain(
        state,
        CHAIN_IDS.OPTIMISM,
      );

      // Controller returns false for extensionActive on unconfigured chains,
      // but inherits numeric values like expectedDeadline/maxDeadline from default
      expect(result.extensionActive).toBe(false);
      expect(result.expectedDeadline).toBe(45);
      expect(result.maxDeadline).toBe(150);
    });

    jestIt(
      'should return default values when no feature flags are configured',
      () => {
        const state = createStateWithFeatureFlags({});

        const result = getSmartTransactionsFeatureFlagsForChain(
          state,
          CHAIN_IDS.MAINNET,
        );

        // Should return default config from the controller
        expect(result).toBeDefined();
        expect(typeof result.extensionActive).toBe('boolean');
      },
    );
  });
});
