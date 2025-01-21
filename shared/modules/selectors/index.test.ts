// Mocha type definitions are conflicting with Jest
import { it as jestIt } from '@jest/globals';

import { createSwapsMockStore } from '../../../test/jest';
import { CHAIN_IDS } from '../../constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import {
  getSmartTransactionsOptInStatusForMetrics,
  getCurrentChainSupportsSmartTransactions,
  getSmartTransactionsEnabled,
  getIsSmartTransaction,
  getSmartTransactionsPreferenceEnabled,
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
            smartTransactions: {
              extensionActive: true,
              mobileActive: false,
            },
          },
        },
        smartTransactionsState: {
          liveness: true,
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

  describe('getCurrentChainSupportsSmartTransactions', () => {
    jestIt(
      'should return true if the chain ID is allowed for smart transactions',
      () => {
        const state = createMockState();
        const result = getCurrentChainSupportsSmartTransactions(state);
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
            ...mockNetworkState({ chainId: CHAIN_IDS.POLYGON }),
          },
        };
        const result = getCurrentChainSupportsSmartTransactions(newState);
        expect(result).toBe(false);
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
        state.metamask.swapsState.swapsFeatureFlags.smartTransactions.extensionActive =
          false;
        expect(getSmartTransactionsEnabled(state)).toBe(false);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW, STX liveness is false and is Ethereum network',
      () => {
        const state = createSwapsMockStore();
        state.metamask.smartTransactionsState.liveness = false;
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
      'returns false if feature flag is enabled, not a HW and is Polygon network',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.POLYGON }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(false);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW and is BSC network',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.BSC }),
          },
        };
        expect(getSmartTransactionsEnabled(newState)).toBe(false);
      },
    );

    jestIt(
      'returns false if feature flag is enabled, not a HW and is Linea network',
      () => {
        const state = createSwapsMockStore();
        const newState = {
          ...state,
          metamask: {
            ...state.metamask,
            ...mockNetworkState({ chainId: CHAIN_IDS.LINEA_MAINNET }),
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
          swapsState: {
            ...state.metamask.swapsState,
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
              smartTransactions: {
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
  });
});
