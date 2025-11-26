import { act } from '@testing-library/react-hooks';
import React from 'react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  MetaMetricsEventName,
  MetaMetricsEventCategory,
} from '../../../shared/constants/metametrics';
import { OptInStatusDto } from '../../../shared/types/rewards';
import { useLinkAccountAddress } from './useLinkAccountAddress';

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

const {
  rewardsIsOptInSupported,
  rewardsGetOptInStatus,
  rewardsLinkAccountsToSubscriptionCandidate,
} = jest.requireMock('../../store/actions') as {
  rewardsIsOptInSupported: jest.Mock;
  rewardsGetOptInStatus: jest.Mock;
  rewardsLinkAccountsToSubscriptionCandidate: jest.Mock;
};

const { setRewardsAccountLinkedTimestamp } = jest.requireMock(
  '../../ducks/rewards',
) as {
  setRewardsAccountLinkedTimestamp: jest.Mock;
};

// MetaMetrics provider container
const mockTrackEvent = jest.fn();
const Container = ({ children }: { children: React.ReactNode }) => (
  <MetaMetricsContext.Provider value={mockTrackEvent}>
    {children}
  </MetaMetricsContext.Provider>
);

describe('useLinkAccountAddress', () => {
  let mockAccount: InternalAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = createMockInternalAccount({
      id: 'test-account-1',
      address: '0x1234567890123456789012345678901234567890',
      name: 'Test Account',
    });

    (rewardsIsOptInSupported as jest.Mock).mockImplementation(() => () => true);
    (rewardsGetOptInStatus as jest.Mock).mockImplementation(
      () => async () => ({ ois: [false], sids: [null] }) as OptInStatusDto,
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
      expect(rewardsLinkAccountsToSubscriptionCandidate).toHaveBeenCalledWith([
        mockAccount,
      ]);

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
      (rewardsGetOptInStatus as jest.Mock).mockImplementation(
        () => async () =>
          ({ ois: [true], sids: ['sub-123'] }) as OptInStatusDto,
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
});
