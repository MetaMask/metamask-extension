import { act } from '@testing-library/react-hooks';
import React from 'react';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { useOptIn } from './useOptIn';

// Mocks
jest.mock('../../store/actions', () => ({
  rewardsOptIn: jest.fn(() => async () => 'sub-123'),
}));

jest.mock('../../selectors/multichain-accounts', () => {
  const actual = jest.requireActual('../../selectors/multichain-accounts');
  return {
    ...actual,
    getIsMultichainAccountsState2Enabled: jest.fn(() => false),
  };
});

jest.mock('../../selectors', () => {
  const actual = jest.requireActual('../../selectors');
  return {
    ...actual,
    getSelectedAccount: jest.fn(() => ({ address: '0x111' })),
  };
});

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
  };
});

jest.mock('../../ducks/rewards', () => ({
  setCandidateSubscriptionId: jest.fn((sid: string) => ({
    type: 'SET_SID',
    payload: sid,
  })),
}));

jest.mock('./useLinkAccountGroup', () => ({
  useLinkAccountGroup: jest.fn(() => ({
    linkAccountGroup: jest.fn(async () => ({ success: true, byAddress: {} })),
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
const { setCandidateSubscriptionId } = jest.requireMock(
  '../../ducks/rewards',
) as { setCandidateSubscriptionId: jest.Mock };
const { getIsMultichainAccountsState2Enabled } = jest.requireMock(
  '../../selectors/multichain-accounts',
) as { getIsMultichainAccountsState2Enabled: jest.Mock };
const { useLinkAccountGroup } = jest.requireMock('./useLinkAccountGroup') as {
  useLinkAccountGroup: jest.Mock;
};
const { getSelectedAccountGroup } = jest.requireMock(
  '../../selectors/multichain-accounts/account-tree',
) as { getSelectedAccountGroup: jest.Mock };

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
    (rewardsOptIn as jest.Mock).mockImplementation(() => async () => 'sub-123');
    getIsMultichainAccountsState2Enabled.mockReturnValue(false);
    getSelectedAccountGroup.mockReturnValue('entropy:test/0');
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
    it('tracks started/completed, dispatches candidate SID, and toggles loading', async () => {
      getIsMultichainAccountsState2Enabled.mockReturnValue(false);
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
      expect(result.current.optinLoading).toBe(false);
      expect(result.current.optinError).toBeNull();
    });

    it('includes referral metrics properties when referralCode is provided', async () => {
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
    });
  });

  describe('Side-effect account group linking', () => {
    it('calls linkAccountGroup when multichain state2 enabled and different group with subscriptionId', async () => {
      getIsMultichainAccountsState2Enabled.mockReturnValue(true);
      getSelectedAccountGroup.mockReturnValue('entropy:test/2');
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-side-1',
      );
      const mockLink = jest.fn(async () => ({ success: true, byAddress: {} }));
      useLinkAccountGroup.mockReturnValue({ linkAccountGroup: mockLink });

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(useLinkAccountGroup).toHaveBeenCalled();
      const events = mockTrackEvent.mock.calls.map((args) => args[0].event);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInStarted);
      expect(events).toContain(MetaMetricsEventName.RewardsOptInCompleted);
    });

    it('swallows link errors without affecting final state', async () => {
      getIsMultichainAccountsState2Enabled.mockReturnValue(true);
      getSelectedAccountGroup.mockReturnValue('entropy:test/2');
      (rewardsOptIn as jest.Mock).mockImplementation(
        () => async () => 'sub-side-2',
      );
      const mockLink = jest.fn(async () => {
        throw new Error('link fail');
      });
      useLinkAccountGroup.mockReturnValue({ linkAccountGroup: mockLink });

      const { result } = renderHookWithProvider(
        () => useOptIn(),
        {},
        undefined,
        Container,
      );

      await act(async () => {
        await result.current.optin();
      });

      expect(useLinkAccountGroup).toHaveBeenCalled();
      expect(result.current.optinError).toBeNull();
      expect(result.current.optinLoading).toBe(false);
      expect(setCandidateSubscriptionId).toHaveBeenCalled();
    });
  });
});
