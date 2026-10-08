import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReferralMeDto } from '../../../../../shared/types/rewards-money';
import { AcceptInviteSheet } from './AcceptInviteSheet';

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);
const mockValidate = jest.fn();
const mockRegister = jest.fn();

const copy = {
  inviteTitle: 'Invite title',
  inviteMessageBody: 'Invite body',
  inviteReferralCode: 'Referral code',
  inviteDecline: 'No thanks',
  inviteAccept: 'Accept invite',
  inviteAcceptedEyebrow: 'You are in',
  inviteAcceptedTitle: 'Activated',
  inviteAcceptedBody: 'Cash back {date}',
  inviteAcceptedCloseA11y: 'Close activated',
  inviteAcceptedStartTrading: 'Start trading',
  inviteAcceptedViewRewards: 'View rewards',
};

function buildReferralMe(
  overrides: Partial<ReferralMeDto> = {},
): ReferralMeDto {
  return {
    role: 'NONE',
    variant: 'NONE',
    localized_text: copy,
    invite_hero: {
      lightModeUrl: 'https://example.com/light.png',
      darkModeUrl: 'https://example.com/dark.png',
    },
    referred_by: null,
    excluded_regions: [],
    ...overrides,
  };
}

const mockReferralState: {
  referralMe: ReferralMeDto | null;
  isSettled: boolean;
  fetch: jest.Mock;
} = {
  referralMe: buildReferralMe(),
  isSettled: true,
  fetch: jest.fn().mockResolvedValue({ status: 'settled' }),
};

const mockT = (key: string) =>
  (
    ({
      close: 'Close',
      rewardsOnboardingReferralCodeError: 'Invalid referral code',
      rewardsOnboardingReferralCodeUnknownError:
        'Referral code couldn’t be validated.',
    }) as Record<string, string>
  )[key] ?? key;

jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => mockT,
}));

jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: () => 'light',
}));

jest.mock('../../../../ducks/rewards/selectors', () => ({
  selectOptinAllowedForGeoError: (state: {
    rewards: { optinAllowedForGeoError: boolean };
  }) => state.rewards.optinAllowedForGeoError,
  selectOptinAllowedForGeoLoading: (state: {
    rewards: { optinAllowedForGeoLoading: boolean };
  }) => state.rewards.optinAllowedForGeoLoading,
}));
jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

jest.mock('../../../../hooks/rewards/useGeoRewardsMetadata', () => ({
  useGeoRewardsMetadata: () => ({
    fetchGeoRewardsMetadata: jest.fn(),
  }),
}));

jest.mock('../../../../hooks/rewards/useReferralMe', () => ({
  useReferralMe: () => ({
    referralMe: mockReferralState.referralMe,
    isSettled: mockReferralState.isSettled,
    fetchReferralMe: (...args: unknown[]) => mockReferralState.fetch(...args),
  }),
  refreshReferralMeWithRetries: async (
    fetchReferralMe: (options?: { forceFresh?: boolean }) => Promise<unknown>,
  ) => {
    await fetchReferralMe({ forceFresh: true });
  },
}));

const mockValidation = {
  isValidating: false,
  isValid: true,
  isUnknownError: false,
  isRejectedCode: false,
  validateCode: jest.fn().mockResolvedValue(''),
};

jest.mock('../../../../hooks/rewards/useValidateMoneyReferralCode', () => ({
  useValidateMoneyReferralCode: () => mockValidation,
}));

jest.mock('../../../../store/actions', () => ({
  validateRewardsMoneyReferralCode: (code: string) => () => mockValidate(code),
  registerRewardsMoneyReferee: (params: { code: string }) => () =>
    mockRegister(params),
  getRewardsMoneyReferralMe: jest.fn(),
}));

function trackedTypes(): string[] {
  return mockTrackEvent.mock.calls.map(
    (call) => call[0].properties.interaction_type as string,
  );
}

function renderSheet({
  initialCode = 'ab12',
  geoLocation = 'GB',
  geoError = false,
  excludedRegions = [] as string[] | null,
  onClose = jest.fn(),
}: {
  initialCode?: string;
  geoLocation?: string | null;
  geoError?: boolean;
  excludedRegions?: string[] | null;
  onClose?: () => void;
} = {}) {
  const store = configureStore({
    reducer: (state = {}) => state,
    preloadedState: {
      metamask: { excludedRegions },
      rewards: {
        geoLocation,
        optinAllowedForGeoError: geoError,
        optinAllowedForGeoLoading: false,
      },
    },
  });

  const view = render(
    <Provider store={store}>
      <AcceptInviteSheet initialCode={initialCode} onClose={onClose} />
    </Provider>,
  );

  return { ...view, onClose, store };
}

describe('AcceptInviteSheet', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
    mockRegister.mockReset();
    mockRegister.mockResolvedValue(undefined);
    mockValidation.isValidating = false;
    mockValidation.isValid = true;
    mockValidation.isUnknownError = false;
    mockValidation.isRejectedCode = false;
    mockValidation.validateCode.mockReset();
    mockValidation.validateCode.mockResolvedValue('');
    mockReferralState.referralMe = buildReferralMe();
    mockReferralState.isSettled = true;
    mockReferralState.fetch.mockReset();
    mockReferralState.fetch.mockResolvedValue({ status: 'settled' });
  });

  it('prefills the route code and lets the user edit it', () => {
    renderSheet({ initialCode: 'ab-12!' });

    const input = document.querySelector(
      '#money-referral-code',
    ) as HTMLInputElement;
    expect(input.value).toBe('AB12');
    expect(document.body).toHaveTextContent('Invite title');

    fireEvent.change(input, { target: { value: 'zz-99' } });
    expect(input.value).toBe('ZZ99');
  });

  it('shows an invalid code from validation and keeps accept disabled', () => {
    mockValidation.isValid = false;
    mockValidation.isRejectedCode = true;
    renderSheet({ initialCode: 'BADCODE' });

    expect(document.body).toHaveTextContent('Invalid referral code');
    expect(
      document.querySelector('[data-testid="money-referral-accept"]'),
    ).toBeDisabled();
  });

  it('auto-dismisses a non-NONE variant without a viewed event', async () => {
    mockReferralState.referralMe = buildReferralMe({
      role: 'REFERRER',
      variant: 'REFERRER',
    });
    const onClose = jest.fn();
    renderSheet({ onClose });

    await act(async () => {});
    expect(onClose).toHaveBeenCalled();
    expect(trackedTypes()).not.toContain('viewed');
    expect(document.body).not.toHaveTextContent('Invite title');
  });

  it('auto-dismisses an excluded country without a viewed event', async () => {
    const onClose = jest.fn();
    renderSheet({
      onClose,
      geoLocation: 'US-CA',
      excludedRegions: ['US'],
    });

    await act(async () => {});
    expect(onClose).toHaveBeenCalled();
    expect(trackedTypes()).not.toContain('viewed');
  });

  it('fails open while excluded regions are still unknown', async () => {
    renderSheet({
      geoLocation: 'US',
      excludedRegions: null,
    });

    expect(document.body).toHaveTextContent('Invite title');
    await act(async () => {});
    expect(trackedTypes()).toContain('viewed');
  });

  it('fails open when geo is unknown', () => {
    renderSheet({
      geoLocation: null,
      geoError: true,
      excludedRegions: ['US'],
    });

    expect(document.body).toHaveTextContent('Invite title');
  });

  it('tracks viewed once and declined from the tertiary button', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const view = renderSheet({ onClose, initialCode: 'AB12CD' });

    expect(trackedTypes()).toEqual(['viewed']);

    await act(async () => {
      await user.click(view.getByTestId('money-referral-decline'));
    });
    expect(trackedTypes()).toEqual(['viewed', 'declined']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tracks dismissed from the close button', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const view = renderSheet({ onClose, initialCode: 'AB12CD' });

    expect(trackedTypes()).toEqual(['viewed']);

    await act(async () => {
      await user.click(view.getByRole('button', { name: 'Close' }));
    });
    expect(trackedTypes()).toEqual(['viewed', 'dismissed']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tracks accepted only after register succeeds and opens the activated modal', async () => {
    const user = userEvent.setup();
    mockReferralState.fetch.mockImplementation(async () => {
      mockReferralState.referralMe = buildReferralMe({
        role: 'REFEREE',
        variant: 'REFEREE',
        referred_by: { cashback_earning_end: '2026-12-01T00:00:00.000Z' },
      });
      return { status: 'settled' };
    });
    const view = renderSheet({ initialCode: 'AB12CD' });

    expect(view.getByTestId('money-referral-accept')).toBeEnabled();

    await act(async () => {
      await user.click(view.getByTestId('money-referral-accept'));
      await Promise.resolve();
    });

    expect(view.getByTestId('money-referral-activated')).toBeInTheDocument();
    expect(mockRegister).toHaveBeenCalledWith({ code: 'AB12CD' });
    expect(trackedTypes()).toContain('accepted');
    expect(document.body).toHaveTextContent(/through/);
    expect(document.body).not.toHaveTextContent('Invite title');
  });

  it('keeps the invite open after it has shown NONE when a later read is REFEREE', async () => {
    const onClose = jest.fn();
    const view = renderSheet({ onClose });

    await act(async () => {});
    expect(trackedTypes()).toContain('viewed');

    mockReferralState.referralMe = buildReferralMe({
      role: 'REFEREE',
      variant: 'REFEREE',
    });
    view.rerender(
      <Provider store={view.store}>
        <AcceptInviteSheet initialCode="ab12" onClose={onClose} />
      </Provider>,
    );

    expect(document.body).toHaveTextContent('Invite title');
    expect(onClose).not.toHaveBeenCalled();
  });
});
