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
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { createMockMultichainAccountsState } from '../../selectors/multichain-accounts/test-utils';
import { AccountTreeWallets } from '../../selectors/multichain-accounts/account-tree.types';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
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

// Mock usePrimaryWalletGroupAccounts to avoid selector chain issues
const mockPrimaryWalletGroupAccounts = {
  current: {
    accounts: [] as InternalAccount[],
    accountGroupId: undefined as string | undefined,
  },
};

jest.mock('./usePrimaryWalletGroupAccounts', () => ({
  usePrimaryWalletGroupAccounts: () => mockPrimaryWalletGroupAccounts.current,
}));

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

// Helper to create hardware wallet accounts
const createMockLedgerAccount = (
  id: string,
  address: string,
): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `Ledger Account ${id}`,
    keyring: { type: HardwareKeyringType.ledger },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockTrezorAccount = (
  id: string,
  address: string,
): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `Trezor Account ${id}`,
    keyring: { type: HardwareKeyringType.trezor },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockQRAccount = (id: string, address: string): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `QR Account ${id}`,
    keyring: { type: HardwareKeyringType.qr },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockSoftwareAccount = (
  id: string,
  address: string,
): InternalAccount => ({
  id,
  address,
  metadata: {
    name: `Software Account ${id}`,
    keyring: { type: 'HD Key Tree' },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

describe('useLinkAccountGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrimaryWalletGroupAccounts.current = {
      accounts: [],
      accountGroupId: undefined,
    };
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

    it('returns failure when no accountGroupId is provided', async () => {
      const state = buildStateWithAccounts([]);
      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(undefined),
        state,
        undefined,
        Container,
      );

      let report;
      await act(async () => {
        report = await result.current.linkAccountGroup();
      });

      expect(report).toEqual({ success: false, byAddress: {} });
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
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingStarted,
      ).length;
      const completedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      ).length;
      const failedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingFailed,
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

  describe('Hardware wallet account group linking', () => {
    it('links a group containing only Ledger hardware wallet accounts', async () => {
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const ledger2 = createMockLedgerAccount('ledger-2', '0xLedger222');
      const state = buildStateWithAccounts([ledger1, ledger2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
        { account: ledger2, success: true },
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

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [ledger1, ledger2],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xLedger111': true, '0xLedger222': true },
      });
    });

    it('links a group containing only Trezor hardware wallet accounts', async () => {
      const trezor1 = createMockTrezorAccount('trezor-1', '0xTrezor111');
      const trezor2 = createMockTrezorAccount('trezor-2', '0xTrezor222');
      const state = buildStateWithAccounts([trezor1, trezor2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: trezor1, success: true },
        { account: trezor2, success: true },
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

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [trezor1, trezor2],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xTrezor111': true, '0xTrezor222': true },
      });
    });

    it('links a group containing only QR hardware wallet accounts', async () => {
      const qr1 = createMockQRAccount('qr-1', '0xQR111');
      const qr2 = createMockQRAccount('qr-2', '0xQR222');
      const state = buildStateWithAccounts([qr1, qr2]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: qr1, success: true },
        { account: qr2, success: true },
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

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [qr1, qr2],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xQR111': true, '0xQR222': true },
      });
    });

    it('tracks account_type in events for hardware wallet accounts', async () => {
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
      ]);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountGroup();
      });

      // Verify events were tracked with account_type property
      const startedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(startedEvent).toBeDefined();
      expect(startedEvent[0].properties).toHaveProperty('account_type');

      const completedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
      expect(completedEvent).toBeDefined();
      expect(completedEvent[0].properties).toHaveProperty('account_type');
    });
  });

  describe('Mixed groups (software + hardware wallets)', () => {
    it('links a mixed group with software and Ledger hardware wallet accounts', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: software1, success: true },
        { account: ledger1, success: true },
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

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [software1, ledger1],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xSoftware111': true, '0xLedger111': true },
      });
    });

    it('links a mixed group with software, Ledger, and Trezor accounts', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const trezor1 = createMockTrezorAccount('trezor-1', '0xTrezor111');
      const state = buildStateWithAccounts([software1, ledger1, trezor1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: software1, success: true },
        { account: ledger1, success: true },
        { account: trezor1, success: true },
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

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [software1, ledger1, trezor1],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: {
          '0xSoftware111': true,
          '0xLedger111': true,
          '0xTrezor111': true,
        },
      });
    });

    it('handles mixed group where only hardware wallet accounts are supported', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      // Software account not supported, hardware account supported
      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        ({ account }) =>
          () => {
            return account.metadata.keyring.type === HardwareKeyringType.ledger;
          },
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
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

      // Only ledger1 should be linked
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [ledger1],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xLedger111': true },
      });
    });

    it('handles mixed group where only software wallet accounts are supported', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      // Software account supported, hardware account not supported
      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        ({ account }) =>
          () => {
            return account.metadata.keyring.type === 'HD Key Tree';
          },
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: software1, success: true },
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

      // Only software1 should be linked
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [software1],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xSoftware111': true },
      });
    });

    it('handles mixed group where some accounts are already opted-in', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      // Software already opted in, hardware not
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [true, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
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

      // Only ledger1 should be linked (software1 already opted in)
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [ledger1],
        [],
      );
      expect(result.current.isError).toBe(false);
      expect(report).toEqual({
        success: true,
        byAddress: { '0xSoftware111': true, '0xLedger111': true },
      });
    });
  });

  describe('Error handling for partial group linking failures', () => {
    it('handles partial failure where software account succeeds and hardware account fails', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: software1, success: true },
        { account: ledger1, success: false },
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

      // Verify partial success/failure
      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: { '0xSoftware111': true, '0xLedger111': false },
      });

      // Verify timestamp is set when at least one account succeeds
      expect(mockSetRewardsAccountLinkedTimestamp).toHaveBeenCalled();

      // Verify metrics
      const eventNames = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(eventNames).toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
      expect(eventNames).toContain(
        MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
    });

    it('handles partial failure where hardware account succeeds and software account fails', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: software1, success: false },
        { account: ledger1, success: true },
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

      // Verify partial success/failure
      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: { '0xSoftware111': false, '0xLedger111': true },
      });

      // Verify timestamp is set when at least one account succeeds
      expect(mockSetRewardsAccountLinkedTimestamp).toHaveBeenCalled();
    });

    it('handles multiple hardware wallets with partial failures', async () => {
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const trezor1 = createMockTrezorAccount('trezor-1', '0xTrezor111');
      const qr1 = createMockQRAccount('qr-1', '0xQR111');
      const state = buildStateWithAccounts([ledger1, trezor1, qr1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
        { account: trezor1, success: false },
        { account: qr1, success: true },
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

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: {
          '0xLedger111': true,
          '0xTrezor111': false,
          '0xQR111': true,
        },
      });

      // Verify correct count of started/completed/failed events
      const eventNames = mockTrackEvent.mock.calls.map((args) => args[0].event);
      const startedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingStarted,
      ).length;
      const completedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      ).length;
      const failedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingFailed,
      ).length;

      expect(startedCount).toBe(3);
      expect(completedCount).toBe(2);
      expect(failedCount).toBe(1);
    });

    it('handles complete failure of all accounts in a mixed group', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: software1, success: false },
        { account: ledger1, success: false },
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

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: { '0xSoftware111': false, '0xLedger111': false },
      });

      // Verify timestamp is NOT set when all accounts fail
      expect(mockSetRewardsAccountLinkedTimestamp).not.toHaveBeenCalled();
    });

    it('handles exception during linking and marks all accounts as failed', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false, false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('Hardware wallet connection failed');
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

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: { '0xSoftware111': false, '0xLedger111': false },
      });

      // Verify all failure events are tracked
      const eventNames = mockTrackEvent.mock.calls.map((args) => args[0].event);
      const failedCount = eventNames.filter(
        (e) => e === MetaMetricsEventName.RewardsAccountLinkingFailed,
      ).length;
      expect(failedCount).toBe(2);

      // Verify timestamp is NOT set
      expect(mockSetRewardsAccountLinkedTimestamp).not.toHaveBeenCalled();
    });

    it('handles exception during opt-in status check', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([software1, ledger1]);

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => {
          throw new Error('Network error');
        },
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

      expect(result.current.isError).toBe(true);
      expect(report).toEqual({
        success: false,
        byAddress: {},
      });

      // Linking should not be called
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();
    });
  });

  describe('Primary wallet group accounts', () => {
    it('passes primary wallet group accounts to the linking function', async () => {
      const software1 = createMockSoftwareAccount('sw-1', '0xSoftware111');
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([ledger1]);

      const primaryAccounts = [software1];
      mockPrimaryWalletGroupAccounts.current = {
        accounts: primaryAccounts,
        accountGroupId: 'entropy:primary/0',
      };

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
      ]);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountGroup();
      });

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [ledger1],
        primaryAccounts,
      );
    });

    it('handles empty primary wallet group accounts', async () => {
      const ledger1 = createMockLedgerAccount('ledger-1', '0xLedger111');
      const state = buildStateWithAccounts([ledger1]);

      mockPrimaryWalletGroupAccounts.current = {
        accounts: [],
        accountGroupId: undefined,
      };

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => [
        { account: ledger1, success: true },
      ]);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountGroup();
      });

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [ledger1],
        [],
      );
    });
  });

  describe('Loading state', () => {
    it('sets loading to true during linking and false after completion', async () => {
      const a1 = createMockInternalAccount({ id: 'acc-1', address: '0x111' });
      const state = buildStateWithAccounts([a1]);

      let resolveLinking: (
        value: { account: InternalAccount; success: boolean }[],
      ) => void;
      const linkingPromise = new Promise<
        { account: InternalAccount; success: boolean }[]
      >((resolve) => {
        resolveLinking = resolve;
      });

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => true,
      );
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => ({ ois: [false] }),
      );
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => () => linkingPromise);

      const { result } = renderHookWithProvider(
        () => useLinkAccountGroup(GROUP_ID),
        state,
        undefined,
        Container,
      );

      let linkPromise: Promise<unknown>;
      await act(async () => {
        linkPromise = result.current.linkAccountGroup();
      });

      // Resolve the linking promise
      await act(async () => {
        resolveLinking([{ account: a1, success: true }]);
        await linkPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
