import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import log from 'loglevel';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
import { useCandidateSubscriptionId } from './useCandidateSubscriptionId';

// Mock store actions used by the hook
jest.mock('../../store/actions', () => ({
  getRewardsCandidateSubscriptionId: jest.fn(() => async () => null),
}));

jest.mock('loglevel', () => ({
  error: jest.fn(),
  setLevel: jest.fn(),
}));

// Mock usePrimaryWalletGroupAccounts hook - use mutable ref pattern for test-level changes
const mockPrimaryWalletGroupAccounts = {
  current: {
    accountGroupId: 'account-group-1',
    accounts: [] as InternalAccount[],
  },
};

jest.mock('./usePrimaryWalletGroupAccounts', () => ({
  usePrimaryWalletGroupAccounts: () => mockPrimaryWalletGroupAccounts.current,
}));

const { getRewardsCandidateSubscriptionId } = jest.requireMock(
  '../../store/actions',
) as { getRewardsCandidateSubscriptionId: jest.Mock };
const mockLogError = log.error as jest.MockedFunction<typeof log.error>;

// Helper to create software wallet account
const createSoftwareAccount = (address: string): InternalAccount =>
  createMockInternalAccount({
    address,
    name: 'Software Account',
  });

// Helper to create hardware wallet accounts
const createLedgerAccount = (address: string): InternalAccount =>
  createMockInternalAccount({
    address,
    name: 'Ledger Account',
    keyringType: HardwareKeyringType.ledger,
  });

const createTrezorAccount = (address: string): InternalAccount =>
  createMockInternalAccount({
    address,
    name: 'Trezor Account',
    keyringType: HardwareKeyringType.trezor,
  });

const createQrAccount = (address: string): InternalAccount =>
  createMockInternalAccount({
    address,
    name: 'QR Hardware Account',
    keyringType: HardwareKeyringType.qr,
  });

describe('useCandidateSubscriptionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to default empty state
    mockPrimaryWalletGroupAccounts.current = {
      accountGroupId: 'account-group-1',
      accounts: [],
    };
  });

  describe('Initial State', () => {
    it('returns fetch function and respects initial candidateSubscriptionId sentinel', () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          rewards: {
            candidateSubscriptionId: 'pending',
          },
        },
      );

      expect(typeof result.current.fetchCandidateSubscriptionId).toBe(
        'function',
      );
      const rewardsState = store?.getState().rewards;
      // Initial state uses sentinel value 'pending' and no separate flags
      expect(rewardsState?.candidateSubscriptionId).toBe('pending');
    });
  });

  describe('Conditional fetching via useEffect', () => {
    it('does nothing when wallet is locked', async () => {
      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'sub-123',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('pending');
      });
    });

    it("fetches when candidateSubscriptionId is 'retry' (regardless of unlock)", async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'new-sub-id',
      );

      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // ensure unlock effect doesn't trigger
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
          rewards: {
            candidateSubscriptionId: 'retry',
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
      });
    });

    it('uses rewardsActiveAccountSubscriptionId when available instead of fetching', async () => {
      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: 'active-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('active-sub-id');
      });
    });

    it('fetches when unlocked and rewardsActiveAccountSubscriptionId is null', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'new-sub-id',
      );

      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
      });
    });

    it('fetches when unlocked and rewardsActiveAccount has null subscriptionId', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'new-sub-id',
      );

      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0x123',
              subscriptionId: null,
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await waitFor(() => {
        expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
        const rewardsState = store?.getState().rewards;
        expect(rewardsState?.candidateSubscriptionId).toBe('new-sub-id');
      });
    });
  });

  describe('fetchCandidateSubscriptionId function', () => {
    it('updates state to returned id when action resolves', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'abc-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // prevent useEffect auto-fetch
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null, // prevent useEffect auto-fetch
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('abc-id');
    });

    it('uses rewardsActiveAccountSubscriptionId when available and does not fetch', async () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // prevent useEffect auto-fetch
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xabc',
              subscriptionId: 'active-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('active-sub-id');
    });

    it('sets to null and does not call action when rewards disabled', async () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: true,
            useExternalServices: false, // disables rewards via selector
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xabc',
              subscriptionId: 'sub-xyz',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
    });

    it('updates state when action resolves (without auto-effect)', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'resolved-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // prevent useEffect auto-fetch
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null, // prevent useEffect auto-fetch
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('resolved-id');
    });

    it("sets candidateSubscriptionId to 'error' when action throws (without auto-effect)", async () => {
      const mockError = new Error('API Error');
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw mockError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // prevent useEffect auto-fetch
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null, // prevent useEffect auto-fetch
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('error');
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        mockError,
      );
    });
  });

  describe('Hardware wallet subscription ID resolution', () => {
    it('passes primary wallet group accounts including Ledger hardware wallet to action', async () => {
      const ledgerAccount = createLedgerAccount('0xLedgerAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [ledgerAccount],
      };

      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'hardware-sub-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        ledgerAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('hardware-sub-id');
    });

    it('passes primary wallet group accounts including Trezor hardware wallet to action', async () => {
      const trezorAccount = createTrezorAccount('0xTrezorAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [trezorAccount],
      };

      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'trezor-sub-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        trezorAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('trezor-sub-id');
    });

    it('passes primary wallet group accounts including QR hardware wallet to action', async () => {
      const qrAccount = createQrAccount('0xQrAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [qrAccount],
      };

      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'qr-sub-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        qrAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('qr-sub-id');
    });

    it('passes mixed software and hardware wallet accounts to action', async () => {
      const softwareAccount = createSoftwareAccount('0xSoftwareAddress');
      const ledgerAccount = createLedgerAccount('0xLedgerAddress');
      const trezorAccount = createTrezorAccount('0xTrezorAddress');

      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [softwareAccount, ledgerAccount, trezorAccount],
      };

      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'mixed-sub-id',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        softwareAccount,
        ledgerAccount,
        trezorAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('mixed-sub-id');
    });

    it('sets special error sentinel when Ledger hardware wallet needs explicit authentication', async () => {
      const ledgerAccount = createLedgerAccount('0xLedgerAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [ledgerAccount],
      };

      const hardwareWalletError = new Error(
        'Primary wallet account group has opted in but is not authenticated yet',
      );
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw hardwareWalletError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        ledgerAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe(
        'error-existing-subscription-hardware-wallet-explicit-sign',
      );
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        hardwareWalletError,
      );
    });

    it('sets special error sentinel when Trezor hardware wallet needs explicit authentication', async () => {
      const trezorAccount = createTrezorAccount('0xTrezorAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [trezorAccount],
      };

      const hardwareWalletError = new Error(
        'Primary wallet account group has opted in but is not authenticated yet',
      );
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw hardwareWalletError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        trezorAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe(
        'error-existing-subscription-hardware-wallet-explicit-sign',
      );
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        hardwareWalletError,
      );
    });

    it('sets special error sentinel when QR hardware wallet needs explicit authentication', async () => {
      const qrAccount = createQrAccount('0xQrAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [qrAccount],
      };

      const hardwareWalletError = new Error(
        'Primary wallet account group has opted in but is not authenticated yet',
      );
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw hardwareWalletError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([
        qrAccount,
      ]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe(
        'error-existing-subscription-hardware-wallet-explicit-sign',
      );
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        hardwareWalletError,
      );
    });

    it('does not trigger retry when candidateSubscriptionId is hardware wallet error value', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'new-sub-id',
      );

      const { store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false, // ensure unlock effect doesn't trigger
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
          rewards: {
            candidateSubscriptionId:
              'error-existing-subscription-hardware-wallet-explicit-sign',
          },
        },
      );

      // Wait a bit to ensure useEffect doesn't trigger
      await waitFor(
        () => {
          expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
          const rewardsState = store?.getState().rewards;
          expect(rewardsState?.candidateSubscriptionId).toBe(
            'error-existing-subscription-hardware-wallet-explicit-sign',
          );
        },
        { timeout: 100 },
      );
    });

    it('sets generic error sentinel for non-hardware-wallet-specific errors', async () => {
      const ledgerAccount = createLedgerAccount('0xLedgerAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [ledgerAccount],
      };

      const genericError = new Error('Network error');
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw genericError;
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('error');
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        genericError,
      );
    });
  });

  describe('Edge cases with no valid subscription', () => {
    it('handles null subscription ID response', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => null,
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
    });

    it('handles empty string subscription ID response', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => '',
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('');
    });

    it('handles empty primary wallet group accounts', async () => {
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [],
      };

      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => null,
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledWith([]);
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
    });

    it('handles non-Error thrown object', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          // eslint-disable-next-line @typescript-eslint/no-throw-literal
          throw 'string error';
        },
      );

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      // Non-Error objects should fall through to generic error handling
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('error');
      expect(mockLogError).toHaveBeenCalledWith(
        '[useCandidateSubscriptionId] Error fetching candidate subscription ID:',
        'string error',
      );
    });

    it('handles rewards disabled with rewardsEnabled flag false', async () => {
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: false },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBeNull();
    });
  });

  describe('Concurrent fetch prevention (isLoading ref)', () => {
    it('prevents multiple concurrent fetches', async () => {
      let resolvePromise: (value: string) => void;
      const slowPromise = new Promise<string>((resolve) => {
        resolvePromise = resolve;
      });

      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => () => slowPromise,
      );

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      // Start first fetch (won't complete immediately)
      act(() => {
        result.current.fetchCandidateSubscriptionId();
      });

      // Try to start second fetch while first is pending
      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      // Should only be called once because isLoading prevents second call
      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);

      // Resolve the promise
      await act(async () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        resolvePromise?.('delayed-sub-id');
      });
    });

    it('resets isLoading after successful fetch allowing subsequent fetches', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'first-sub-id',
      );

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      // First fetch
      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);

      // Second fetch should be allowed after first completes
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'second-sub-id',
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(2);
    });

    it('resets isLoading after failed fetch allowing subsequent fetches', async () => {
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => {
          throw new Error('First fetch failed');
        },
      );

      const { result } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: null,
            rewardsSubscriptions: {},
          },
        },
      );

      // First fetch (will fail)
      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(1);

      // Second fetch should be allowed after first completes (even with failure)
      (getRewardsCandidateSubscriptionId as jest.Mock).mockImplementation(
        () => async () => 'second-sub-id',
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).toHaveBeenCalledTimes(2);
    });
  });

  describe('rewardsActiveAccountSubscriptionId takes precedence', () => {
    it('uses active account subscription ID even with hardware wallet in group', async () => {
      const ledgerAccount = createLedgerAccount('0xLedgerAddress');
      mockPrimaryWalletGroupAccounts.current = {
        accountGroupId: 'account-group-1',
        accounts: [ledgerAccount],
      };

      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xLedgerAddress',
              subscriptionId: 'active-hw-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      // Should not fetch because active account subscription ID is available
      expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('active-hw-sub-id');
    });

    it('skips fetch and resets isLoading when active account subscription ID becomes available', async () => {
      // This tests the early return path at line 43-48
      const { result, store } = renderHookWithProvider(
        () => useCandidateSubscriptionId(),
        {
          metamask: {
            isUnlocked: false,
            useExternalServices: true,
            remoteFeatureFlags: { rewardsEnabled: true },
            rewardsActiveAccount: {
              account: 'eip155:1:0xabc',
              subscriptionId: 'existing-sub-id',
            },
            rewardsSubscriptions: {},
          },
        },
      );

      await act(async () => {
        await result.current.fetchCandidateSubscriptionId();
      });

      expect(getRewardsCandidateSubscriptionId).not.toHaveBeenCalled();
      const rewardsState = store?.getState().rewards;
      expect(rewardsState?.candidateSubscriptionId).toBe('existing-sub-id');
    });
  });
});
