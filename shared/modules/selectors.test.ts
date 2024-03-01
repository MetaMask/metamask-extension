import { createSwapsMockStore } from '../../test/jest';
import { CHAIN_IDS } from '../constants/network';
import {
  getSmartTransactionsOptInStatus,
  getSelectedInternalAccount,
  getCurrentKeyring,
  isHardwareWallet,
  getIsAllowedStxChainId,
  getSmartTransactionsEnabled,
  getIsSmartTransaction,
} from './selectors';

describe('Selectors', () => {
  const createMockState = () => {
    return {
      metamask: {
        preferences: {
          stxOptIn: true,
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
            },
          },
        },
        providerConfig: {
          chainId: CHAIN_IDS.MAINNET,
        },
        swapsState: {
          swapsFeatureFlags: {
            smartTransactions: {
              extensionActive: true,
            },
          },
        },
        smartTransactionsState: {
          liveness: true,
        },
      },
    };
  };

  describe('getSmartTransactionsOptInStatus', () => {
    it('should return the smart transactions opt-in status', () => {
      const state = createMockState();
      const result = getSmartTransactionsOptInStatus(state);
      expect(result).toBe(true);
    });
  });

  describe('getSelectedInternalAccount', () => {
    it('should return the selected internal account', () => {
      const state = createMockState();
      const result = getSelectedInternalAccount(state);
      expect(result).toStrictEqual(
        state.metamask.internalAccounts.accounts.account1,
      );
    });

    it('should return null if no account is selected', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          internalAccounts: {
            ...state.metamask.internalAccounts,
            selectedAccount: null,
          },
        },
      };
      const result = getSelectedInternalAccount(newState);
      expect(result).toBeNull();
    });
  });

  describe('getCurrentKeyring', () => {
    it('should return the current keyring', () => {
      const state = createMockState();
      const result = getCurrentKeyring(state);
      expect(result).toStrictEqual(
        state.metamask.internalAccounts.accounts.account1.metadata.keyring,
      );
    });

    it('should return null if no internal account is selected', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          internalAccounts: {
            ...state.metamask.internalAccounts,
            selectedAccount: null,
          },
        },
      };
      const result = getCurrentKeyring(newState);
      expect(result).toBeNull();
    });
  });

  describe('isHardwareWallet', () => {
    it('should return true if the current wallet is a hardware wallet', () => {
      const state = createMockState();
      const result = isHardwareWallet(state);
      expect(result).toBe(true);
    });

    it('should return false if the current wallet is not a hardware wallet', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          internalAccounts: {
            ...state.metamask.internalAccounts,
            accounts: {
              account1: {
                metadata: {
                  keyring: {
                    type: 'Default',
                  },
                },
              },
            },
          },
        },
      };
      const result = isHardwareWallet(newState);
      expect(result).toBe(false);
    });
  });

  describe('getIsAllowedStxChainId', () => {
    it('should return true if the chain ID is allowed for smart transactions', () => {
      const state = createMockState();
      const result = getIsAllowedStxChainId(state);
      expect(result).toBe(true);
    });

    it('should return false if the chain ID is not allowed for smart transactions', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          providerConfig: {
            ...state.metamask.providerConfig,
            chainId: CHAIN_IDS.POLYGON,
          },
        },
      };
      const result = getIsAllowedStxChainId(newState);
      expect(result).toBe(false);
    });
  });

  describe('getSmartTransactionsEnabled', () => {
    it('returns true if feature flag is enabled, not a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      expect(getSmartTransactionsEnabled(state)).toBe(true);
    });

    it('returns false if feature flag is disabled, not a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      state.metamask.swapsState.swapsFeatureFlags.smartTransactions.extensionActive =
        false;
      expect(getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW, STX liveness is false and is Ethereum network', () => {
      const state = createSwapsMockStore();
      state.metamask.smartTransactionsState.liveness = false;
      expect(getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, is a HW and is Ethereum network', () => {
      const state = createSwapsMockStore();
      (state.metamask.internalAccounts.accounts as any)[
        state.metamask.internalAccounts.selectedAccount
      ].metadata.keyring.type = 'Trezor Hardware';
      expect(getSmartTransactionsEnabled(state)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW and is Polygon network', () => {
      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          providerConfig: {
            ...state.metamask.providerConfig,
            chainId: CHAIN_IDS.POLYGON,
          },
        },
      };
      expect(getSmartTransactionsEnabled(newState)).toBe(false);
    });

    it('returns false if feature flag is enabled, not a HW and is BSC network', () => {
      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          providerConfig: {
            ...state.metamask.providerConfig,
            chainId: CHAIN_IDS.BSC,
          },
        },
      };
      expect(getSmartTransactionsEnabled(newState)).toBe(false);
    });

    it('returns true if feature flag is enabled, not a HW and is Goerli network', () => {
      const state = createSwapsMockStore();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          providerConfig: {
            ...state.metamask.providerConfig,
            chainId: CHAIN_IDS.GOERLI,
          },
        },
      };
      expect(getSmartTransactionsEnabled(newState)).toBe(true);
    });

    it('returns false if a snap account is used', () => {
      const state = createSwapsMockStore();
      state.metamask.internalAccounts.selectedAccount =
        '36eb02e0-7925-47f0-859f-076608f09b69';
      expect(getSmartTransactionsEnabled(state)).toBe(false);
    });
  });

  describe('getIsSmartTransaction', () => {
    it('should return true if smart transactions are opt-in and enabled', () => {
      const state = createMockState();
      const result = getIsSmartTransaction(state);
      expect(result).toBe(true);
    });

    it('should return false if smart transactions are not opt-in', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          preferences: {
            ...state.metamask.preferences,
            stxOptIn: false,
          },
        },
      };
      const result = getIsSmartTransaction(newState);
      expect(result).toBe(false);
    });

    it('should return false if smart transactions are not enabled', () => {
      const state = createMockState();
      const newState = {
        ...state,
        metamask: {
          ...state.metamask,
          swapsState: {
            ...state.metamask.swapsState,
            swapsFeatureFlags: {
              smartTransactions: {
                extensionActive: false,
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
