import React, { type ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';
import rewardsMoneyReducer from '../../ducks/rewards-money';
import {
  MAX_REFERRAL_ME_REFRESH_ATTEMPTS,
  useReferralMe,
} from './useReferralMe';

const mockGetReferralMe = jest.fn();
const referralMeMessenger = {
  call: (...args: unknown[]) => mockGetReferralMe(...args),
};

jest.mock('../useMessenger', () => ({
  useMessenger: () => referralMeMessenger,
}));

const referralMe = {
  role: 'NONE',
  variant: 'NONE',
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  localized_text: {
    inviteTitle: 'Invite',
    inviteMessageBody: 'Body',
    inviteReferralCode: 'Code',
    inviteDecline: 'Decline',
    inviteAccept: 'Accept',
    inviteAcceptedEyebrow: 'Eyebrow',
    inviteAcceptedTitle: 'Title',
    inviteAcceptedBody: 'Body {date}',
    inviteAcceptedCloseA11y: 'Close',
    inviteAcceptedStartTrading: 'Start',
    inviteAcceptedViewRewards: 'View',
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  invite_hero: null,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  referred_by: null,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  excluded_regions: [],
} as ReferralMeDto;

const sessionChangedOnData = {
  data: { sessionChanged: true },
};

const sessionChangedAfterRpc = {
  data: { cause: { data: { sessionChanged: true } } },
};

function renderReferralMe(fetchOnMount = true) {
  const store = configureStore({
    reducer: { rewardsMoney: rewardsMoneyReducer },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useReferralMe({ fetchOnMount }), { wrapper });
}

describe('useReferralMe', () => {
  beforeEach(() => {
    mockGetReferralMe.mockReset();
  });

  it.each([
    ['error.data', sessionChangedOnData],
    ['error.data.cause.data', sessionChangedAfterRpc],
  ])(
    'retries a mount-time session change reported on %s',
    async (_label, sessionChanged) => {
      mockGetReferralMe
        .mockRejectedValueOnce(sessionChanged)
        .mockResolvedValueOnce(referralMe);

      const { result } = renderReferralMe();

      await waitFor(() => {
        expect(result.current.referralMe).toBe(referralMe);
      });
      expect(result.current.isSettled).toBe(true);
      expect(mockGetReferralMe).toHaveBeenCalledTimes(2);
      expect(mockGetReferralMe).toHaveBeenNthCalledWith(
        2,
        'RewardsMoneyController:getReferralMe',
        { forceFresh: true },
      );
    },
  );

  it('marks the mount read settled when every session-change retry is discarded', async () => {
    mockGetReferralMe.mockRejectedValue(sessionChangedOnData);

    const { result } = renderReferralMe();

    await waitFor(() => {
      expect(result.current.isSettled).toBe(true);
    });
    expect(result.current.referralMe).toBeNull();
    expect(mockGetReferralMe).toHaveBeenCalledTimes(
      MAX_REFERRAL_ME_REFRESH_ATTEMPTS,
    );
  });

  it('settles a mount-time failure that is not a session change without retrying', async () => {
    mockGetReferralMe.mockRejectedValue(new Error('network'));

    const { result } = renderReferralMe();

    await waitFor(() => {
      expect(result.current.isSettled).toBe(true);
    });
    expect(result.current.referralMe).toBeNull();
    expect(mockGetReferralMe).toHaveBeenCalledTimes(1);
  });

  it('does not fetch on mount when fetchOnMount is false', () => {
    renderReferralMe(false);

    expect(mockGetReferralMe).not.toHaveBeenCalled();
  });
});
