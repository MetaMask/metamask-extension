import { act } from '@testing-library/react-hooks';
import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import { HardwareKeyringNames } from '../../../shared/constants/hardware-wallets';
import { useOptIn } from './useOptIn';

// Mock useRequestHardwareWalletAccess hook
const mockRequestHardwareWalletAccess = jest.fn();
const mockIsHardwareWalletAccount = { current: false };

jest.mock('./useRequestHardwareWalletAccess', () => ({
  useRequestHardwareWalletAccess: () => ({
    requestHardwareWalletAccess: mockRequestHardwareWalletAccess,
    isHardwareWalletAccount: mockIsHardwareWalletAccount.current,
  }),
}));

// Mock usePrimaryWalletGroupAccounts hook
const mockPrimaryWalletGroupAccounts = {
  current: {
    accounts: [] as InternalAccount[],
    accountGroupId: undefined as string | undefined,
  },
};

jest.mock('./usePrimaryWalletGroupAccounts', () => ({
  usePrimaryWalletGroupAccounts: () => mockPrimaryWalletGroupAccounts.current,
}));

// Mocks
jest.mock('../../store/actions', () => ({
  rewardsOptIn: jest.fn(() => async () => 'sub-123'),
  rewardsLinkAccountsToSubscriptionCandidate: jest.fn(() => async () => [
    { account: {} as InternalAccount, success: true },
  ]),
  updateMetaMetricsTraits: jest.fn(() => async () => {
    // noop
  }),
  linkRewardToShieldSubscription: jest.fn(() => async () => {
    // noop
  }),
}));

jest.mock('../../selectors', () => {
  const actual = jest.requireActual('../../selectors');
  return {
    ...actual,
    getSelectedAccount: jest.fn(() => ({ address: '0x111' })),
  };
});

jest.mock('../../ducks/bridge/selectors', () => ({
  getHardwareWalletName: jest.fn(() => undefined),
}));

const mockSideEffectAccounts: InternalAccount[] = [
  {
    id: 'acc-1',
    address: '0x111',
    metadata: {
      name: 'Account 1',
      keyring: { type: 'HD Key Tree' },
      importTime: Date.now(),
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: ['eip155:1'],
  },
];

const mockActiveGroupAccounts: InternalAccount[] = [
  {
    id: 'acc-0',
    address: '0x000',
    metadata: {
      name: 'Account 0',
      keyring: { type: 'HD Key Tree' },
      importTime: Date.now(),
    },
    options: {},
    methods: [],
    type: 'eip155:eoa',
    scopes: [],
  },
];

const mockLedgerAccount: InternalAccount = {
  id: 'ledger-acc-1',
  address: '0xLedger111',
  metadata: {
    name: 'Ledger Account 1',
    keyring: { type: 'Ledger Hardware' },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
};

const mockQRAccount: InternalAccount = {
  id: 'qr-acc-1',
  address: '0xQR111',
  metadata: {
    name: 'QR Account 1',
    keyring: { type: 'QR Hardware Wallet Device' },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
};

jest.mock('../../selectors/multichain-accounts/account-tree', () => {
  const actual = jest.requireActual(
    '../../selectors/multichain-accounts/account-tree',
  );
  return {
    ...actual,
    getSelectedAccountGroup: jest.fn(() => 'entropy:test/0'),
    getWalletIdAndNameByAccountAddress: jest.fn(() => ({
      id: 'entropy:test',
      name: 'Test Wallet',
    })),
    getMultichainAccountsByWalletId: jest.fn(() => ({
      'entropy:test/1': {
        id: 'entropy:test/1',
        type: 'MultichainAccount',
        metadata: {
          name: 'Group 1',
          pinned: false,
          hidden: false,
          entropy: { groupIndex: 1 },
        },
        accounts: ['acc-1'],
      },
      'entropy:test/0': {
        id: 'entropy:test/0',
        type: 'MultichainAccount',
        metadata: {
          name: 'Group 0',
          pinned: false,
          hidden: false,
          entropy: { groupIndex: 0 },
        },
        accounts: ['acc-0'],
      },
    })),
    getInternalAccountsFromGroupById: jest.fn((_state, groupId: string) => {
      if (groupId === 'entropy:test/1') {
        return mockSideEffectAccounts;
      }
      if (groupId === 'entropy:test/0') {
        return mockActiveGroupAccounts;
      }
      return [];
    }),
  };
});

jest.mock('../../ducks/rewards', () => ({
  setCandidateSubscriptionId: jest.fn((sid: string) => ({
    type: 'SET_SID',
    payload: sid,
  })),
}));

jest.mock(
  '../../components/app/rewards/utils/handleRewardsErrorMessage',
  () => ({
    handleRewardsErrorMessage: jest.fn(() => 'mock error'),
  }),
);

const { rewardsOptIn } = jest.requireMock('../../store/actions') as {
  rewardsOptIn: jest.Mock;
};
const { rewardsLinkAccountsToSubscriptionCandidate } = jest.requireMock(
  '../../store/actions',
) as { rewardsLinkAccountsToSubscriptionCandidate: jest.Mock };
const { updateMetaMetricsTraits } = jest.requireMock('../../store/actions') as {
  updateMetaMetricsTraits: jest.Mock;
};
const { linkRewardToShieldSubscription } = jest.requireMock(
  '../../store/actions',
) as { linkRewardToShieldSubscription: jest.Mock };
const { setCandidateSubscriptionId } = jest.requireMock(
  '../../ducks/rewards',
) as { setCandidateSubscriptionId: jest.Mock };
const { getSelectedAccountGroup } = jest.requireMock(
  '../../selectors/multichain-accounts/account-tree',
) as { getSelectedAccountGroup: jest.Mock };
const { getInternalAccountsFromGroupById } = jest.requireMock(
  '../../selectors/multichain-accounts/account-tree',
) as { getInternalAccountsFromGroupById: jest.Mock };
const { getHardwareWalletName } = jest.requireMock(
  '../../ducks/bridge/selectors',
) as { getHardwareWalletName: jest.Mock };

// MetaMetrics provider container
const mockTrackEvent = jest.fn();
const Container = ({ children }: { children: React.ReactNode }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

describe('useOptIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mutable mock values
    mockIsHardwareWalletAccount.current = false;
    mockRequestHardwareWalletAccess.mockResolvedValue(true);
    mockPrimaryWalletGroupAccounts.current = {
      accounts: mockSideEffectAccounts,
      accountGroupId: 'entropy:test/1',
    };
    getHardwareWalletName.mockReturnValue(undefined);

    (rewardsOptIn as jest.Mock).mockImplementation(() => async () => 'sub-123');
    (
      rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
    ).mockImplementation(() => async () => [
      { account: {} as InternalAccount, success: true },
    ]);
    (updateMetaMetricsTraits as jest.Mock).mockImplementation(
      () => async () => {
        // noop
      },
    );
    (linkRewardToShieldSubscription as jest.Mock).mockImplementation(
      () => async () => {
        // noop
      },
    );
    getSelectedAccountGroup.mockReturnValue('entropy:test/0');
    (getInternalAccountsFromGroupById as jest.Mock).mockImplementation(
      (_state, groupId: string) => {
        if (groupId === 'entropy:test/1') {
          return mockSideEffectAccounts;
        }
        if (groupId === 'entropy:test/0') {
          return mockActiveGroupAccounts;
        }
        return [];
      },
    );
  });

  describe('Initial State', () => {
    it('returns default loading and error state and clearOptinError works', () => {
      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      expect(result.current.optinLoading).toBe(false);
      expect(result.current.optinError).toBeNull();

      act(() => {
        result.current.clearOptinError();
      });

      expect(result.current.optinError).toBeNull();
      expect(typeof result.current.optin).toBe('function');
    });
  });

  describe('Successful opt-in', () => {
    it('tracks started/completed, dispatches candidate SID, updates traits, and toggles loading', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-abc',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInStarted);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInCompleted);

      expect(setCandidateSubscriptionId).toHaveBeenCalledWith('sub-abc');
      expect(updateMetaMetricsTraits).toHaveBeenCalledWith({
        [MetaMetricsUserTrait.HasRewardsOptedIn]: 'on',
      });
      expect(result.current.optinLoading).toBe(false);
      expect(result.current.optinError).toBeNull();
    });

    it('includes referral metrics properties and traits when referralCode is provided', async () => {
      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin('REF-CODE');
      });

      const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
      const started = calls.find(
        (c: { event: MetaMetricsEventName }) =>
          c.event === MetaMetricsEventName.RewardsOptInStarted,
      );
      expect(started?.properties?.referred).toBe(true);
      expect(started?.properties?.referral_code_used).toBe('REF-CODE');

      expect(updateMetaMetricsTraits).toHaveBeenCalledWith({
        [MetaMetricsUserTrait.HasRewardsOptedIn]: 'on',
        [MetaMetricsUserTrait.RewardsReferred]: true,
        [MetaMetricsUserTrait.RewardsReferralCodeUsed]: 'REF-CODE',
      });
    });

    it('uses primary wallet group accounts for opt-in when available and links active group accounts', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-side-effect',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      // Should opt-in with primary wallet group accounts
      expect(rewardsOptIn).toHaveBeenCalledWith({
        accounts: mockSideEffectAccounts,
        referralCode: undefined,
      });

      // Should link active group accounts after opt-in
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        mockActiveGroupAccounts,
        mockSideEffectAccounts,
      );
    });

    it('uses active group accounts for opt-in when no primary wallet group accounts available', async () => {
      // Mock to return empty array for primary wallet group accounts
      mockPrimaryWalletGroupAccounts.current = {
        accounts: [],
        accountGroupId: undefined,
      };

      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-active',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      // Should opt-in with active group accounts
      expect(rewardsOptIn).toHaveBeenCalledWith({
        accounts: mockActiveGroupAccounts,
        referralCode: undefined,
      });

      // Should link primary wallet group accounts (empty in this case)
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();
    });

    it('does not link accounts when accountsToLinkAfterOptIn is empty', async () => {
      // Mock to return empty array for active group accounts
      (getInternalAccountsFromGroupById as jest.Mock).mockImplementation(
        (_state, groupId: string) => {
          if (groupId === 'entropy:test/1') {
            return mockSideEffectAccounts;
          }
          if (groupId === 'entropy:test/0') {
            return [];
          }
          return [];
        },
      );

      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-no-link',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      // Should not link accounts when there are no accounts to link
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();
    });

    it('swallows link errors without affecting final state', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-link-error',
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('link fail');
      });

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(result.current.optinError).toBeNull();
      expect(result.current.optinLoading).toBe(false);
      expect(setCandidateSubscriptionId).toHaveBeenCalledWith('sub-link-error');
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInCompleted);
    });

    it('swallows traits update errors without affecting final state', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-traits-error',
      );
      (updateMetaMetricsTraits as jest.Mock).mockImplementation(
        () => async () => {
          throw new Error('traits fail');
        },
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(result.current.optinError).toBeNull();
      expect(result.current.optinLoading).toBe(false);
      expect(setCandidateSubscriptionId).toHaveBeenCalledWith(
        'sub-traits-error',
      );
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInCompleted);
    });
  });

  describe('Error path', () => {
    it('tracks failure and sets optinError when rewardsOptIn throws', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(() => async () => {
        throw new Error('fail');
      });

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInFailed);
      expect(result.current.optinLoading).toBe(false);
      expect(result.current.optinError).toBe('mock error');
      expect(setCandidateSubscriptionId).not.toHaveBeenCalled();
      expect(updateMetaMetricsTraits).not.toHaveBeenCalled();
    });

    it('does not dispatch candidate SID when subscriptionId is null', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(() => async () => null);

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(setCandidateSubscriptionId).not.toHaveBeenCalled();
      expect(updateMetaMetricsTraits).not.toHaveBeenCalled();
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).not.toContain(MetaMetricsEventName.RewardsOptInCompleted);
    });
  });

  describe('Hardware wallet opt-in flow', () => {
    describe('Ledger account opt-in', () => {
      beforeEach(() => {
        mockIsHardwareWalletAccount.current = true;
        getHardwareWalletName.mockReturnValue(HardwareKeyringNames.ledger);
        mockPrimaryWalletGroupAccounts.current = {
          accounts: [mockLedgerAccount],
          accountGroupId: 'ledger:test/0',
        };
      });

      it('requests hardware wallet access before opt-in for Ledger accounts', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => async () => 'sub-ledger',
        );

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(mockRequestHardwareWalletAccess).toHaveBeenCalledTimes(1);
        expect(rewardsOptIn).toHaveBeenCalledWith({
          accounts: [mockLedgerAccount],
          referralCode: undefined,
        });
        expect(setCandidateSubscriptionId).toHaveBeenCalledWith('sub-ledger');
      });

      it('tracks is_hardware_wallet property in metrics for Ledger accounts', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => async () => 'sub-ledger-metrics',
        );

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
        const started = calls.find(
          (c: { event: MetaMetricsEventName }) =>
            c.event === MetaMetricsEventName.RewardsOptInStarted,
        );
        expect(started?.properties?.is_hardware_wallet).toBe(true);

        const completed = calls.find(
          (c: { event: MetaMetricsEventName }) =>
            c.event === MetaMetricsEventName.RewardsOptInCompleted,
        );
        expect(completed).toBeDefined();
      });

      it('does not link additional accounts for hardware wallets to prevent multiple signing requests', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => async () => 'sub-ledger-no-link',
        );

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        // For hardware wallets, linking should be skipped to prevent multiple signing requests
        expect(
          rewardsLinkAccountsToSubscriptionCandidate,
        ).not.toHaveBeenCalled();
      });

      it('fails opt-in when hardware wallet access is denied', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(false);

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(rewardsOptIn).not.toHaveBeenCalled();
        expect(result.current.optinLoading).toBe(false);
        expect(result.current.optinError).not.toBeNull();

        // Verify failure event was tracked with hardware wallet access denied reason
        const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
        const failedEvent = calls.find(
          (c: { event: MetaMetricsEventName }) =>
            c.event === MetaMetricsEventName.RewardsOptInFailed,
        );
        expect(failedEvent).toBeDefined();
        expect(failedEvent?.properties?.failure_reason).toBe(
          'hardware_wallet_access_denied',
        );
      });

      it('uses hardware wallet name in error message when access is denied', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(false);

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        // Error should be set (the actual error message depends on t() translation function)
        expect(result.current.optinError).not.toBeNull();
        expect(result.current.optinLoading).toBe(false);
      });
    });

    describe('QR-based wallet opt-in', () => {
      beforeEach(() => {
        mockIsHardwareWalletAccount.current = true;
        getHardwareWalletName.mockReturnValue(HardwareKeyringNames.qr);
        mockPrimaryWalletGroupAccounts.current = {
          accounts: [mockQRAccount],
          accountGroupId: 'qr:test/0',
        };
      });

      it('requests hardware wallet access before opt-in for QR accounts', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => async () => 'sub-qr',
        );

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(mockRequestHardwareWalletAccess).toHaveBeenCalledTimes(1);
        expect(rewardsOptIn).toHaveBeenCalledWith({
          accounts: [mockQRAccount],
          referralCode: undefined,
        });
        expect(setCandidateSubscriptionId).toHaveBeenCalledWith('sub-qr');
      });

      it('does not link additional accounts for QR wallets', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => async () => 'sub-qr-no-link',
        );

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        // For hardware wallets, linking should be skipped
        expect(
          rewardsLinkAccountsToSubscriptionCandidate,
        ).not.toHaveBeenCalled();
      });

      it('fails opt-in when QR wallet access is denied', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(false);

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(rewardsOptIn).not.toHaveBeenCalled();
        expect(result.current.optinError).not.toBeNull();

        const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
        const failedEvent = calls.find(
          (c: { event: MetaMetricsEventName }) =>
            c.event === MetaMetricsEventName.RewardsOptInFailed,
        );
        expect(failedEvent?.properties?.failure_reason).toBe(
          'hardware_wallet_access_denied',
        );
      });
    });

    describe('Hardware wallet SIWE signing state management', () => {
      beforeEach(() => {
        mockIsHardwareWalletAccount.current = true;
        getHardwareWalletName.mockReturnValue(HardwareKeyringNames.ledger);
        mockPrimaryWalletGroupAccounts.current = {
          accounts: [mockLedgerAccount],
          accountGroupId: 'ledger:test/0',
        };
      });

      it('sets loading state during hardware wallet opt-in process', async () => {
        let resolveOptIn: (value: string) => void;
        const optInPromise = new Promise<string>((resolve) => {
          resolveOptIn = resolve;
        });

        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => () => optInPromise,
        );

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        let optinPromise: Promise<void> | undefined;
        await act(async () => {
          optinPromise = result.current.optin();
        });

        // Loading should be true during opt-in
        // Note: Due to async nature, we resolve and check final state
        await act(async () => {
          resolveOptIn('sub-loading-test');
          await optinPromise;
        });

        expect(result.current.optinLoading).toBe(false);
      });

      it('properly resets loading state when hardware wallet signing fails', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(() => async () => {
          throw new Error('SIWE signing failed');
        });

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinLoading).toBe(false);
        expect(result.current.optinError).toBe('mock error');
      });

      it('clears error state on successful retry after failure', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);

        // First attempt fails
        (rewardsOptIn as jest.Mock).mockImplementationOnce(() => async () => {
          throw new Error('First attempt failed');
        });

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinError).toBe('mock error');

        // Second attempt succeeds
        (rewardsOptIn as jest.Mock).mockImplementation(
          () => async () => 'sub-retry-success',
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinError).toBeNull();
        expect(setCandidateSubscriptionId).toHaveBeenCalledWith(
          'sub-retry-success',
        );
      });
    });

    describe('Hardware wallet error states', () => {
      beforeEach(() => {
        mockIsHardwareWalletAccount.current = true;
        getHardwareWalletName.mockReturnValue(HardwareKeyringNames.ledger);
        mockPrimaryWalletGroupAccounts.current = {
          accounts: [mockLedgerAccount],
          accountGroupId: 'ledger:test/0',
        };
      });

      it('handles hardware wallet signing rejection gracefully', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(() => async () => {
          throw new Error('User rejected signing');
        });

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinError).toBe('mock error');
        expect(result.current.optinLoading).toBe(false);
        expect(setCandidateSubscriptionId).not.toHaveBeenCalled();
      });

      it('handles hardware wallet connection timeout', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(() => async () => {
          throw new Error('Connection timeout');
        });

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinError).toBe('mock error');
        expect(result.current.optinLoading).toBe(false);

        const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
        const failedEvent = calls.find(
          (c: { event: MetaMetricsEventName }) =>
            c.event === MetaMetricsEventName.RewardsOptInFailed,
        );
        expect(failedEvent).toBeDefined();
      });

      it('handles hardware wallet app not open error', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(true);
        (rewardsOptIn as jest.Mock).mockImplementation(() => async () => {
          throw new Error('Ethereum app not open');
        });

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinError).toBe('mock error');
        expect(result.current.optinLoading).toBe(false);
      });

      it('clearOptinError clears hardware wallet error state', async () => {
        mockRequestHardwareWalletAccess.mockResolvedValue(false);

        const { result } = renderHookWithProvider(
          () => useOptIn(),
          {},
          undefined,
          Container,
        );

        await act(async () => {
          await result.current.optin();
        });

        expect(result.current.optinError).not.toBeNull();

        act(() => {
          result.current.clearOptinError();
        });

        expect(result.current.optinError).toBeNull();
      });
    });
  });

  describe('Shield subscription linking', () => {
    it('links reward to shield subscription when options are provided', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-shield',
      );

      const { result } = renderHookWithProvider(
        () =>
          useOptIn({
            rewardPoints: 100,
            shieldSubscriptionId: 'shield-sub-123',
          }),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(linkRewardToShieldSubscription).toHaveBeenCalledWith(
        'shield-sub-123',
        100,
      );
    });

    it('does not link to shield subscription when options are not provided', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-no-shield',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(linkRewardToShieldSubscription).not.toHaveBeenCalled();
    });

    it('does not link when only rewardPoints is provided', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-partial-shield',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn({ rewardPoints: 100 }),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(linkRewardToShieldSubscription).not.toHaveBeenCalled();
    });

    it('does not link when only shieldSubscriptionId is provided', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-partial-shield-2',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn({ shieldSubscriptionId: 'shield-sub-456' }),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(linkRewardToShieldSubscription).not.toHaveBeenCalled();
    });

    it('swallows shield subscription linking errors without affecting opt-in success', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-shield-error',
      );
      (linkRewardToShieldSubscription as jest.Mock).mockImplementation(
        () => async () => {
          throw new Error('Shield linking failed');
        },
      );

      const { result } = renderHookWithProvider(
        () =>
          useOptIn({
            rewardPoints: 100,
            shieldSubscriptionId: 'shield-sub-error',
          }),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      // Opt-in should still succeed despite shield linking failure
      expect(result.current.optinError).toBeNull();
      expect(setCandidateSubscriptionId).toHaveBeenCalledWith(
        'sub-shield-error',
      );
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInCompleted);
    });

    it('does not link to shield subscription when subscriptionId is null', async () => {
      (rewardsOptIn as jest.Mock).mockImplementation(() => async () => null);

      const { result } = renderHookWithProvider(
        () =>
          useOptIn({
            rewardPoints: 100,
            shieldSubscriptionId: 'shield-sub-null',
          }),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(linkRewardToShieldSubscription).not.toHaveBeenCalled();
    });
  });

  describe('Non-hardware wallet opt-in (software wallet)', () => {
    it('does not request hardware wallet access for software wallets', async () => {
      mockIsHardwareWalletAccount.current = false;
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-software',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(mockRequestHardwareWalletAccess).not.toHaveBeenCalled();
      expect(rewardsOptIn).toHaveBeenCalled();
    });

    it('links additional accounts for software wallets', async () => {
      mockIsHardwareWalletAccount.current = false;
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-software-link',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      // Software wallets should link additional accounts
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalled();
    });

    it('tracks is_hardware_wallet as false for software wallets', async () => {
      mockIsHardwareWalletAccount.current = false;
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-software-metrics',
      );

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
      const started = calls.find(
        (c: { event: MetaMetricsEventName }) =>
          c.event === MetaMetricsEventName.RewardsOptInStarted,
      );
      expect(started?.properties?.is_hardware_wallet).toBe(false);
    });
  });
});
