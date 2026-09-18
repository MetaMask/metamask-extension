import { KeyringType } from '../../../shared/constants/keyring';
import { BatchSellFeatureFlag, getIsBatchSellEnabled } from './feature-flags';

const MOCK_ACCOUNT_ID = 'mock-account-id';

type MockState = {
  metamask: {
    remoteFeatureFlags: {
      batchSell?: BatchSellFeatureFlag;
    };
    internalAccounts: {
      accounts: Record<string, { metadata: { keyring: { type: string } } }>;
      selectedAccount: string;
    };
  };
};

const getMockState = (
  batchSell?: BatchSellFeatureFlag,
  keyringType: string = KeyringType.hdKeyTree,
): MockState => ({
  metamask: {
    remoteFeatureFlags: { batchSell },
    internalAccounts: {
      accounts: {
        [MOCK_ACCOUNT_ID]: {
          metadata: { keyring: { type: keyringType } },
        },
      },
      selectedAccount: MOCK_ACCOUNT_ID,
    },
  },
});

describe('getIsBatchSellEnabled', () => {
  describe('flag absent or disabled', () => {
    it('returns false when batchSell flag is absent', () => {
      expect(getIsBatchSellEnabled(getMockState(undefined))).toBe(false);
    });

    it('returns false when remoteFeatureFlags is empty', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {},
          internalAccounts: {
            accounts: {
              [MOCK_ACCOUNT_ID]: {
                metadata: { keyring: { type: KeyringType.hdKeyTree } },
              },
            },
            selectedAccount: MOCK_ACCOUNT_ID,
          },
        },
      };
      expect(getIsBatchSellEnabled(state)).toBe(false);
    });

    it('returns false when enabled is false', () => {
      expect(getIsBatchSellEnabled(getMockState({ enabled: false }))).toBe(
        false,
      );
    });

    it('returns false when enabled is undefined', () => {
      expect(getIsBatchSellEnabled(getMockState({}))).toBe(false);
    });
  });

  describe('flag enabled', () => {
    it('returns true when enabled is true and account is not a hardware wallet', () => {
      expect(getIsBatchSellEnabled(getMockState({ enabled: true }))).toBe(true);
    });

    it('returns true when account is an imported (non-hardware) wallet', () => {
      expect(
        getIsBatchSellEnabled(
          getMockState({ enabled: true }, KeyringType.imported),
        ),
      ).toBe(true);
    });
  });

  describe('hardware wallet gating', () => {
    it('returns false when a Ledger account is selected', () => {
      expect(
        getIsBatchSellEnabled(
          getMockState({ enabled: true }, KeyringType.ledger),
        ),
      ).toBe(false);
    });

    it('returns false when a Trezor account is selected', () => {
      expect(
        getIsBatchSellEnabled(
          getMockState({ enabled: true }, KeyringType.trezor),
        ),
      ).toBe(false);
    });
  });
});
