import { it } from '@jest/globals';
import React, { type ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReferralMeDto } from '../../../shared/types/rewards-money';
import { captureException } from '../../../shared/lib/sentry';
import rewardsMoneyReducer from '../../ducks/rewards-money';
import {
  MAX_REFERRAL_ME_REFRESH_ATTEMPTS,
  useReferralMe,
} from './useReferralMe';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockCaptureException = captureException as jest.MockedFunction<
  typeof captureException
>;

const mockGetReferralMe = jest.fn();
const referralMeMessenger = {
  call: (...args: unknown[]) => mockGetReferralMe(...args),
};

jest.mock('../useMessenger', () => ({
  useMessenger: () => referralMeMessenger,
}));

const referralMe = {
  roles: [],
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  ui_variant: 'NONE',
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
  /* eslint-disable @typescript-eslint/naming-convention -- money API fields */
  earn_rates: {
    cashback_rate_bps: null,
    cashback_earning_start: null,
    cashback_earning_end: null,
    revshare_rate_bps: null,
    revshare_earning_start: null,
    revshare_earning_end: null,
  },
  /* eslint-enable @typescript-eslint/naming-convention */
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
    mockCaptureException.mockClear();
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

  it('reports a hard failure and skips a disabled controller', async () => {
    mockGetReferralMe.mockRejectedValueOnce(new Error('network'));
    const { result, unmount } = renderReferralMe();

    await waitFor(() => {
      expect(result.current.isSettled).toBe(true);
    });
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: {
        feature: 'rewards-money',
        context: 'referralMe.fetch_failed',
      },
    });

    unmount();
    mockCaptureException.mockClear();
    mockGetReferralMe.mockRejectedValueOnce(
      new Error('Rewards Money is disabled'),
    );
    const disabled = renderReferralMe();
    await waitFor(() => {
      expect(disabled.result.current.isSettled).toBe(true);
    });
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('skips Sentry for the first short busy read and reports the follow-up', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(globalThis.crypto, 'getRandomValues')
      .mockImplementation((array) => {
        (array as Uint32Array)[0] = 0;
        return array;
      });
    const busy = { data: { status: 503, retryAfterSeconds: 1 } };
    mockGetReferralMe
      .mockRejectedValueOnce(busy)
      .mockRejectedValueOnce(new Error('still busy'));

    try {
      const { result } = renderReferralMe();
      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isSettled).toBe(false);
      expect(mockCaptureException).not.toHaveBeenCalled();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      expect(result.current.isSettled).toBe(true);
      expect(mockGetReferralMe).toHaveBeenCalledTimes(2);
      expect(mockCaptureException).toHaveBeenCalledTimes(1);
    } finally {
      jest.restoreAllMocks();
      jest.useRealTimers();
    }
  });
});
