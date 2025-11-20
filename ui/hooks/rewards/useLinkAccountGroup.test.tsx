import { act } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import React from 'react';
import {
  AccountGroupId,
  AccountWalletType,
  AccountGroupType,
  AccountWalletStatus,
} from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { createMockMultichainAccountsState } from '../../selectors/multichain-accounts/test-utils';
import { AccountTreeWallets } from '../../selectors/multichain-accounts/account-tree.types';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { useLinkAccountGroup } from './useLinkAccountGroup';

// Mock store actions used by the hook
jest.mock('../../store/actions', () => ({
  rewardsIsOptInSupported: jest.fn(() => () => true),
  rewardsGetOptInStatus: jest.fn(() => async () => ({ ois: [] })),
  rewardsLinkAccountsToSubscriptionCandidate: jest.fn(
    () => async () => [] as { account: InternalAccount; success: boolean }[],
  ),
}));

// Mock the rewards duck to spy on setRewardsAccountLinkedTimestamp
jest.mock('../../ducks/rewards', () => {
  const actual = jest.requireActual('../../ducks/rewards');
  return {
    ...actual,
    setRewardsAccountLinkedTimestamp: jest.fn((timestamp: number) => ({
      type: 'rewards/setRewardsAccountLinkedTimestamp',
      payload: timestamp,
    })),
  };
});

const {
  rewardsIsOptInSupported,
  rewardsGetOptInStatus,
  rewardsLinkAccountsToSubscriptionCandidate,
} = jest.requireMock('../../store/actions') as {
  rewardsIsOptInSupported: jest.Mock;
  rewardsGetOptInStatus: jest.Mock;
  rewardsLinkAccountsToSubscriptionCandidate: jest.Mock;
};

const {
  setRewardsAccountLinkedTimestamp: mockSetRewardsAccountLinkedTimestamp,
} = jest.requireMock('../../ducks/rewards') as {
  setRewardsAccountLinkedTimestamp: jest.Mock;
};

// Simple container to provide MetaMetrics context
const mockTrackEvent = jest.fn();
const Container = ({ children }: { children: React.ReactNode }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

// Helpers to build minimal state with a wallet and group
const WALLET_ID = 'entropy:test';
const GROUP_ID = 'entropy:test/0' as AccountGroupId;

const buildStateWithAccounts = (accounts: InternalAccount[]) => {
  const wallets: AccountTreeWallets = {
    [WALLET_ID]: {
      id: WALLET_ID,
      type: AccountWalletType.Entropy,
      metadata: {
        name: 'Test Wallet',
        entropy: { id: 'test' },
      },
      // Status is present in many wallet objects across tests; include to satisfy type narrowing
      status: 'ready' as AccountWalletStatus,
      groups: {
        [GROUP_ID]: {
          id: GROUP_ID,
          type: AccountGroupType.MultichainAccount,
          metadata: {
            name: 'Group',
            pinned: false,
            hidden: false,
            entropy: { groupIndex: 0 },
          },
          accounts: accounts.map((a) => a.id),
        },
      },
    },
  } as unknown as AccountTreeWallets;

  return createMockMultichainAccountsState(
    {
      wallets,
      selectedAccountGroup: GROUP_ID,
    },
    {
      accounts: accounts.reduce<Record<string, InternalAccount>>((acc, a) => {
        acc[a.id] = a;
        return acc;
      }, {}),
      selectedAccount: accounts[0]?.id ?? '',
    },
  );
};

describe('useLinkAccountGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('exposes link function and initial state is not loading or error', () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const state = buildStateWithAccounts([a1]);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      expect(typeof result.current.linkAccountGroup).toBe('function');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
    });
  });

  describe('No eligible accounts', () => {
    it('returns failure and sets error when group has no accounts', async () => {
      const state = buildStateWithAccounts([]);
      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      expect(rewardsIsOptInSupported).toHaveBeenCalledTimes(0);
      expect(rewardsGetOptInStatus).toHaveBeenCalledTimes(0);
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledTimes(
        0,
      );
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(report).toEqual({ success: false, byAddress: {} });
    });
  });

  describe('Already opted-in', () => {
    it('does not link and returns success when all accounts are opted-in', async () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const a2 = createMockInternalAccount({ id: 'acc-2', address: '0x222' });
      const state = buildStateWithAccounts([a1, a2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [true, true] }),
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      expect(rewardsIsOptInSupported).toHaveBeenCalledTimes(2);
      expect(rewardsGetOptInStatus).toHaveBeenCalledTimes(1);
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0x111': true, '0x222': true },
      });
    });
  });

  describe('Linking accounts and metrics', () => {
    it('links accounts and tracks started/completed/failed events', async () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const a2 = createMockInternalAccount({ id: 'acc-2', address: '0x222' });
      const state = buildStateWithAccounts([a1, a2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: a1, success: true },
        { account: a2, success: false },
      ]);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      expect(rewardsIsOptInSupported).toHaveBeenCalledTimes(2);
      expect(rewardsGetOptInStatus).toHaveBeenCalledTimes(1);
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledTimes(
        1,
      );

      // Metrics: started for both, then completed for one, failed for one
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalled();
      });
      const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
      const eventNames = calls.map(
        (c: { event: MetaMetricsEventName }) => c.event,
      );
      const startedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingStarted,
      ).length;
      const completedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      ).length;
      const failedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingFailed,
      ).length;

      expect(startedCount).toBe(2);
      expect(completedCount).toBe(1);
      expect(failedCount).toBe(1);

      // Verify timestamp is set when at least one account succeeds
      expect(mockSetRewardsAccountLinkedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockSetRewardsAccountLinkedTimestamp).toHaveBeenCalledWith(
        expect.any(Number),
      );

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: { '0x111': true, '0x222': false },
      });
    });

    it('handles link action error by marking all accounts failed and tracking failures', async () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const a2 = createMockInternalAccount({ id: 'acc-2', address: '0x222' });
      const state = buildStateWithAccounts([a1, a2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('linking failed');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      // Started events for both, then failed for both
      const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
      const eventNames = calls.map(
        (c: { event: MetaMetricsEventName }) => c.event,
      );
      const startedCount = eventNames.filter(
        (e) => e === 'REWARDS_ACCOUNT_LINKING_STARTED',
      ).length;
      const completedCount = eventNames.filter(
        (e) => e === 'REWARDS_ACCOUNT_LINKING_COMPLETED',
      ).length;
      const failedCount = eventNames.filter(
        (e) => e === 'REWARDS_ACCOUNT_LINKING_FAILED',
      ).length;

      expect(startedCount).toBe(2);
      expect(completedCount).toBe(0);
      expect(failedCount).toBe(2);

      // Verify timestamp is NOT set when all accounts fail
      expect(mockSetRewardsAccountLinkedTimestamp).not.toHaveBeenCalled();

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: { '0x111': false, '0x222': false },
      });
    });

    it('links all accounts successfully, dispatches timestamp, and returns success', async () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const a2 = createMockInternalAccount({ id: 'acc-2', address: '0x222' });
      const state = buildStateWithAccounts([a1, a2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: a1, success: true },
        { account: a2, success: true },
      ]);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      expect(rewardsIsOptInSupported).toHaveBeenCalledTimes(2);
      expect(rewardsGetOptInStatus).toHaveBeenCalledTimes(1);
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledTimes(
        1,
      );

      // Metrics: started for both, then completed for both
      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalled();
      });
      const calls = mockTrackEvent.mock.calls.map((args) => args[0]);
      const eventNames = calls.map(
        (c: { event: MetaMetricsEventName }) => c.event,
      );
      const startedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingStarted,
      ).length;
      const completedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      ).length;
      const failedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingFailed,
      ).length;

      expect(startedCount).toBe(2);
      expect(completedCount).toBe(2);
      expect(failedCount).toBe(0);

      // Verify timestamp is set when all accounts succeed
      expect(mockSetRewardsAccountLinkedTimestamp).toHaveBeenCalledTimes(1);
      expect(mockSetRewardsAccountLinkedTimestamp).toHaveBeenCalledWith(
        expect.any(Number),
      );

      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0x111': true, '0x222': true },
      });
    });

    it('does not dispatch timestamp when no accounts are supported', async () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const a2 = createMockInternalAccount({ id: 'acc-2', address: '0x222' });
      const state = buildStateWithAccounts([a1, a2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => false,
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      expect(rewardsIsOptInSupported).toHaveBeenCalledTimes(2);
      expect(rewardsGetOptInStatus).not.toHaveBeenCalled();
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();

      // Verify timestamp is NOT set when no accounts are supported
      expect(mockSetRewardsAccountLinkedTimestamp).not.toHaveBeenCalled();

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: {},
      });
    });
  });
});
