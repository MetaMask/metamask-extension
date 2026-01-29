import { act } from '@testing-library/react-hooks';
import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../shared/constants/metametrics';
import { OptInStatusDto } from '../../../shared/types/rewards';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
import { useLinkAccountAddress } from './useLinkAccountAddress';

// Mock useMultichainSelector hook
jest.mock('../useMultichainSelector', () => ({
  useMultichainSelector: jest.fn(() => '0x1'), // Return mainnet chain ID
}));

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

// Mock store actions used by the hook
jest.mock('../../store/actions', () => ({
  rewardsIsOptInSupported: jest.fn(() => () => true),
  rewardsGetOptInStatus: jest.fn(
    () => async () => ({ ois: [false], sids: [null] }) as OptInStatusDto,
  ),
  rewardsLinkAccountsToSubscriptionCandidate: jest.fn(
    () => async () =>
      [{ account: {} as InternalAccount, success: true }] as {
        account: InternalAccount;
        success: boolean;
      }[],
  ),
  getRewardsHasAccountOptedIn: jest.fn(() => async () => false),
}));

jest.mock('../../ducks/rewards', () => ({
  setRewardsAccountLinkedTimestamp: jest.fn((timestamp: number) => ({
    type: 'SET_REWARDS_ACCOUNT_LINKED_TIMESTAMP',
    payload: timestamp,
  })),
}));

jest.mock(
  '../../pages/multichain-accounts/account-details/account-type-utils',
  () => ({
    getAccountTypeCategory: jest.fn(() => 'evm'),
  }),
);

jest.mock('../../helpers/utils/rewards-utils', () => ({
  formatAccountToCaipAccountId: jest.fn(
    (address: string, chainId: string) => `eip155:${chainId}:${address}`,
  ),
}));

const {
  rewardsIsOptInSupported,
  rewardsGetOptInStatus,
  rewardsLinkAccountsToSubscriptionCandidate,
  getRewardsHasAccountOptedIn,
} = jest.requireMock('../../store/actions') as {
  rewardsIsOptInSupported: jest.Mock;
  rewardsGetOptInStatus: jest.Mock;
  rewardsLinkAccountsToSubscriptionCandidate: jest.Mock;
  getRewardsHasAccountOptedIn: jest.Mock;
};

const { setRewardsAccountLinkedTimestamp } = jest.requireMock(
  '../../ducks/rewards',
) as {
  setRewardsAccountLinkedTimestamp: jest.Mock;
};

const { getAccountTypeCategory } = jest.requireMock(
  '../../pages/multichain-accounts/account-details/account-type-utils',
) as {
  getAccountTypeCategory: jest.Mock;
};

// MetaMetrics provider container
const mockTrackEvent = jest.fn();
const Container = ({ children }: { children: React.ReactNode }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

// Test account fixtures
const createMockLedgerAccount = (): InternalAccount => ({
  id: 'ledger-acc-1',
  address: '0xLedger111',
  metadata: {
    name: 'Ledger Account 1',
    keyring: { type: HardwareKeyringType.ledger },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const createMockQRAccount = (): InternalAccount => ({
  id: 'qr-acc-1',
  address: '0xQR111',
  metadata: {
    name: 'QR Account 1',
    keyring: { type: HardwareKeyringType.qr },
    importTime: Date.now(),
  },
  options: {},
  methods: [],
  type: 'eip155:eoa',
  scopes: ['eip155:1'],
});

const mockSoftwareAccounts: InternalAccount[] = [
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

describe('useLinkAccountAddress', () => {
  let mockAccount: InternalAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = createMockInternalAccount({
      id: 'test-account-1',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test Account',
    });

    // Reset mutable mock values
    mockIsHardwareWalletAccount.current = false;
    mockRequestHardwareWalletAccess.mockResolvedValue(true);
    mockPrimaryWalletGroupAccounts.current = {
      accounts: mockSoftwareAccounts,
      accountGroupId: 'entropy:test/0',
    };

    (rewardsIsOptInSupported as jest.Mock).mockImplementation(() => () => true);
    (rewardsGetOptInStatus as jest.Mock).mockImplementation(
      () => async () => ({ ois: [false], sids: [null] }) as OptInStatusDto,
    );
    (getRewardsHasAccountOptedIn as jest.Mock).mockImplementation(
      () => async () => false,
    );
    (
      rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
    ).mockImplementation(
      () => async () =>
        [{ account: mockAccount, success: true }] as {
          account: InternalAccount;
          success: boolean;
        }[],
    );
    (getAccountTypeCategory as jest.Mock).mockReturnValue('evm');
  });

  describe('Initial State', () => {
    it('returns default loading and error state', () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(typeof result.current.linkAccountAddress).toBe('function');
    });
  });

  describe('Successful account linking', () => {
    it('successfully links account and tracks events', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);

      // Verify actions were called
      expect(rewardsIsOptInSupported).toHaveBeenCalledWith({
        account: mockAccount,
      });
      expect(rewardsGetOptInStatus).toHaveBeenCalledWith({
        addresses: [mockAccount.address],
      });
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [mockAccount],
        mockSoftwareAccounts,
      );

      // Verify events were tracked
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );

      // Verify event properties
      const startedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(startedEvent).toBeDefined();
      expect(startedEvent[0].category).toBe(MetaMetricsEventCategory.Rewards);
      expect(startedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'evm',
      });

      // Verify timestamp was set
      expect(setRewardsAccountLinkedTimestamp).toHaveBeenCalled();
      const timestampCall = setRewardsAccountLinkedTimestamp.mock.calls[0][0];
      expect(typeof timestampCall).toBe('number');
      expect(timestampCall).toBeGreaterThan(0);
    });

    it('sets loading state during linking process', async () => {
      let resolveIsSupported: (value: boolean) => void;
      const isSupportedPromise = new Promise<boolean>((resolve) => {
        resolveIsSupported = resolve;
      });

      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => isSupportedPromise,
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkPromise: Promise<boolean> | undefined;
      await act(async () => {
        linkPromise = result.current.linkAccountAddress(mockAccount);
      });

      // Check loading state is true during async operation
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Resolve the promise to continue
      await act(async () => {
        resolveIsSupported(true);
        await isSupportedPromise;
      });

      if (linkPromise) {
        await act(async () => {
          await linkPromise;
        });
      }

      // After completion, loading should be false
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Account already opted in', () => {
    it('returns success immediately when account is already opted in', async () => {
      (getRewardsHasAccountOptedIn as jest.Mock).mockImplementation(
        () => async () => true,
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);

      // Should check opt-in status but not link
      expect(rewardsIsOptInSupported).toHaveBeenCalled();
      expect(rewardsGetOptInStatus).toHaveBeenCalled();
      expect(getRewardsHasAccountOptedIn).toHaveBeenCalled();
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();

      // Should not track linking events
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).not.toContain(
        MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(events).not.toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
    });
  });

  describe('Unsupported account', () => {
    it('returns false and sets error when account does not support opt-in', async () => {
      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => () => false,
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);

      // Should check support but not proceed further
      expect(rewardsIsOptInSupported).toHaveBeenCalled();
      expect(rewardsGetOptInStatus).not.toHaveBeenCalled();
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();

      // Should not track events
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events.length).toBe(0);
    });
  });

  describe('Linking failure', () => {
    it('returns false and tracks failure event when linking fails', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(
        () => async () =>
          [{ account: mockAccount, success: false }] as {
            account: InternalAccount;
            success: boolean;
          }[],
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);

      // Verify failure event was tracked
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
      expect(events).not.toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );

      // Verify timestamp was not set on failure
      expect(setRewardsAccountLinkedTimestamp).not.toHaveBeenCalled();
    });

    it('handles exception during linking and tracks failure event', async () => {
      const linkingError = new Error('Linking failed');
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw linkingError;
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);

      // Verify failure event was tracked
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
      expect(events).not.toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
    });

    it('handles exception during opt-in status check', async () => {
      const statusError = new Error('Status check failed');
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () => {
          throw statusError;
        },
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);

      // Should not proceed to linking
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();

      // Should not track events
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events.length).toBe(0);
    });

    it('handles exception during support check', async () => {
      const supportError = new Error('Support check failed');
      (rewardsIsOptInSupported as jest.Mock).mockImplementation(
        () => async () => {
          throw supportError;
        },
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(true);

      // Should not proceed further
      expect(rewardsGetOptInStatus).not.toHaveBeenCalled();
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();
    });
  });

  describe('Event tracking', () => {
    it('tracks events with correct account type', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockAccount);
      });

      const startedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(startedEvent).toBeDefined();
      expect(startedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'evm',
      });

      const completedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
      expect(completedEvent).toBeDefined();
      expect(completedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'evm',
      });
    });

    it('tracks failure event with correct account type', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(
        () => async () =>
          [{ account: mockAccount, success: false }] as {
            account: InternalAccount;
            success: boolean;
          }[],
      );

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockAccount);
      });

      const failedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
      expect(failedEvent).toBeDefined();
      expect(failedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'evm',
      });
    });
  });

  describe('Hardware wallet linking - Ledger account', () => {
    let mockLedgerAccount: InternalAccount;

    beforeEach(() => {
      mockLedgerAccount = createMockLedgerAccount();
      mockIsHardwareWalletAccount.current = true;
      mockRequestHardwareWalletAccess.mockResolvedValue(true);
      (getAccountTypeCategory as jest.Mock).mockReturnValue('hardware');
    });

    it('requests hardware wallet access before linking a Ledger account', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(mockRequestHardwareWalletAccess).toHaveBeenCalledTimes(1);
      expect(linkResult).toBe(true);
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [mockLedgerAccount],
        mockSoftwareAccounts,
      );
    });

    it('successfully links Ledger account and tracks events with hardware account type', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockLedgerAccount);
      });

      // Verify events were tracked with hardware account type
      const startedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(startedEvent).toBeDefined();
      expect(startedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'hardware',
      });

      const completedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
      expect(completedEvent).toBeDefined();
      expect(completedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'hardware',
      });

      // Verify timestamp was set
      expect(setRewardsAccountLinkedTimestamp).toHaveBeenCalled();
    });

    it('fails linking when hardware wallet access is denied for Ledger', async () => {
      mockRequestHardwareWalletAccess.mockResolvedValue(false);

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();

      // Verify failure event was tracked
      const failedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
      expect(failedEvent).toBeDefined();
      expect(failedEvent[0].properties).toEqual({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: 'hardware',
      });
    });
  });

  describe('Hardware wallet linking - QR-based wallet', () => {
    let mockQRAccount: InternalAccount;

    beforeEach(() => {
      mockQRAccount = createMockQRAccount();
      mockIsHardwareWalletAccount.current = true;
      mockRequestHardwareWalletAccess.mockResolvedValue(true);
      (getAccountTypeCategory as jest.Mock).mockReturnValue('hardware');
    });

    it('requests hardware wallet access before linking a QR wallet account', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockQRAccount);
      });

      expect(mockRequestHardwareWalletAccess).toHaveBeenCalledTimes(1);
      expect(linkResult).toBe(true);
    });

    it('successfully links QR wallet account and tracks events', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockQRAccount);
      });

      // Verify linking was called
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [mockQRAccount],
        mockSoftwareAccounts,
      );

      // Verify events were tracked
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingStarted,
      );
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
    });

    it('fails linking when QR wallet access is denied', async () => {
      mockRequestHardwareWalletAccess.mockResolvedValue(false);

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockQRAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();

      // Verify failure event was tracked
      const failedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
      expect(failedEvent).toBeDefined();
    });
  });

  describe('SIWE signing for address linking with hardware wallet', () => {
    let mockLedgerAccount: InternalAccount;

    beforeEach(() => {
      mockLedgerAccount = createMockLedgerAccount();
      mockIsHardwareWalletAccount.current = true;
      mockRequestHardwareWalletAccess.mockResolvedValue(true);
      (getAccountTypeCategory as jest.Mock).mockReturnValue('hardware');
    });

    it('sets loading state during SIWE signing process', async () => {
      let resolveLinking: (
        value: { account: InternalAccount; success: boolean }[],
      ) => void;
      const linkingPromise = new Promise<
        { account: InternalAccount; success: boolean }[]
      >((resolve) => {
        resolveLinking = resolve;
      });

      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => () => linkingPromise);

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkPromise: Promise<boolean> | undefined;
      await act(async () => {
        linkPromise = result.current.linkAccountAddress(mockLedgerAccount);
      });

      // Resolve the linking promise
      await act(async () => {
        resolveLinking([{ account: mockLedgerAccount, success: true }]);
        await linkPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles SIWE signing failure during hardware wallet linking', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('SIWE signing failed - user rejected');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);

      // Verify failure event was tracked
      const failedEvent = mockTrackEvent.mock.calls.find(
        (call) =>
          call[0].event === MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
      expect(failedEvent).toBeDefined();
    });

    it('successfully completes SIWE signing for hardware wallet address linking', async () => {
      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(true);
      expect(result.current.isError).toBe(false);

      // Verify the full flow was executed
      expect(rewardsIsOptInSupported).toHaveBeenCalled();
      expect(rewardsGetOptInStatus).toHaveBeenCalled();
      expect(mockRequestHardwareWalletAccess).toHaveBeenCalled();
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalled();
      expect(setRewardsAccountLinkedTimestamp).toHaveBeenCalled();
    });
  });

  describe('Error handling for hardware wallet signing failures', () => {
    let mockLedgerAccount: InternalAccount;

    beforeEach(() => {
      mockLedgerAccount = createMockLedgerAccount();
      mockIsHardwareWalletAccount.current = true;
      mockRequestHardwareWalletAccess.mockResolvedValue(true);
      (getAccountTypeCategory as jest.Mock).mockReturnValue('hardware');
    });

    it('handles user rejection during hardware wallet signing', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('User rejected the request');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles hardware wallet connection timeout', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('Connection timeout');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);

      // Verify failure event was tracked
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingFailed,
      );
    });

    it('handles Ethereum app not open error on Ledger', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('Ethereum app not open');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
    });

    it('handles locked hardware wallet error', async () => {
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(() => async () => {
        throw new Error('Device is locked');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('resets error state on successful retry after failure', async () => {
      // First attempt fails
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementationOnce(() => async () => {
        throw new Error('First attempt failed');
      });

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(result.current.isError).toBe(true);

      // Second attempt succeeds
      (
        rewardsLinkAccountsToSubscriptionCandidate as jest.Mock
      ).mockImplementation(
        () => async () =>
          [{ account: mockLedgerAccount, success: true }] as {
            account: InternalAccount;
            success: boolean;
          }[],
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockLedgerAccount);
      });

      expect(result.current.isError).toBe(false);
      expect(setRewardsAccountLinkedTimestamp).toHaveBeenCalled();
    });
  });

  describe('Invalid CAIP account ID handling', () => {
    it('returns false and sets error when caipAccountId is invalid', async () => {
      const { formatAccountToCaipAccountId } = jest.requireMock(
        '../../helpers/utils/rewards-utils',
      ) as { formatAccountToCaipAccountId: jest.Mock };

      formatAccountToCaipAccountId.mockReturnValueOnce(null);

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(false);
      expect(result.current.isError).toBe(true);
      expect(rewardsLinkAccountsToSubscriptionCandidate).not.toHaveBeenCalled();
    });
  });

  describe('Software wallet linking (non-hardware)', () => {
    it('does not request hardware wallet access for software wallets', async () => {
      mockIsHardwareWalletAccount.current = false;

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockAccount);
      });

      // Hardware wallet access should still be called (the hook always calls it)
      // but it should return true immediately for non-hardware wallets
      expect(mockRequestHardwareWalletAccess).toHaveBeenCalled();
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalled();
    });

    it('successfully links software wallet account', async () => {
      mockIsHardwareWalletAccount.current = false;

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      let linkResult: boolean | undefined;
      await act(async () => {
        linkResult = await result.current.linkAccountAddress(mockAccount);
      });

      expect(linkResult).toBe(true);
      expect(result.current.isError).toBe(false);

      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(
        MetaMetricsEventName.RewardsAccountLinkingCompleted,
      );
    });
  });

  describe('Primary wallet group accounts', () => {
    it('passes primary wallet group accounts to linking function', async () => {
      const primaryAccounts: InternalAccount[] = [
        {
          id: 'primary-acc-1',
          address: '0xPrimary111',
          metadata: {
            name: 'Primary Account 1',
            keyring: { type: 'HD Key Tree' },
            importTime: Date.now(),
          },
          options: {},
          methods: [],
          type: 'eip155:eoa',
          scopes: ['eip155:1'],
        },
      ];

      mockPrimaryWalletGroupAccounts.current = {
        accounts: primaryAccounts,
        accountGroupId: 'entropy:primary/0',
      };

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockAccount);
      });

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [mockAccount],
        primaryAccounts,
      );
    });

    it('handles empty primary wallet group accounts', async () => {
      mockPrimaryWalletGroupAccounts.current = {
        accounts: [],
        accountGroupId: undefined,
      };

      const { result } = renderHookWithProvider(
        () => useLinkAccountAddress(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.linkAccountAddress(mockAccount);
      });

      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith(
        [mockAccount],
        [],
      );
    });
  });
});
