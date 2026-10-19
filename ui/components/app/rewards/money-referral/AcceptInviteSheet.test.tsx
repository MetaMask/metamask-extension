import React from 'react';
import { it } from '@jest/globals';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { act, fireEvent, render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReferralMeDto } from '../../../../../shared/types/rewards-money';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { AcceptInviteSheet } from './AcceptInviteSheet';

const mockTrackEvent = jest.fn().mockResolvedValue(undefined);
const mockRegister = jest.fn();
const inviteMessenger = {
  call: (_action: string, params: { code: string }) => mockRegister(params),
};

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
    roles: [],
    /* eslint-disable @typescript-eslint/naming-convention -- money API fields */
    ui_variant: 'NONE',
    localized_text: copy,
    invite_hero: {
      lightModeUrl: 'https://example.com/light.png',
      darkModeUrl: 'https://example.com/dark.png',
    },
    referred_by: null,
    earn_rates: {
      cashback_rate_bps: 1000,
      cashback_earning_start: null,
      cashback_earning_end: null,
      revshare_rate_bps: null,
      revshare_earning_start: null,
      revshare_earning_end: null,
    },
    excluded_regions: [],
    /* eslint-enable @typescript-eslint/naming-convention */
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
      rewardsMoneyReferralCodeError: 'Invalid referral code',
      rewardsMoneyReferralCodeUnknownError:
        'Referral code couldn’t be validated.',
      rewardsMoneyReferralTooManyTries:
        messages.rewardsMoneyReferralTooManyTries.message,
      rewardsMoneyReferralCodeLabel:
        messages.rewardsMoneyReferralCodeLabel.message,
      musdEducationNotNow: messages.musdEducationNotNow.message,
      continue: messages.continue.message,
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

jest.mock('../../../../contexts/route-messenger', () => ({
  RouteMessengerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../../../../hooks/useMessenger', () => ({
  useMessenger: () => inviteMessenger,
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
    expect(input).not.toHaveAttribute('aria-describedby');
    expect(document.body).toHaveTextContent('Invite title');

    fireEvent.change(input, { target: { value: 'zz-99' } });
    expect(input.value).toBe('ZZ99');
  });

  it('shows an invalid code from validation and keeps accept disabled', () => {
    mockValidation.isValid = false;
    mockValidation.isRejectedCode = true;
    renderSheet({ initialCode: 'BADCODE' });

    const input = document.querySelector(
      '[data-testid="money-referral-code-input"]',
    );
    const error = document.getElementById('money-referral-code-error');
    expect(error).toHaveTextContent('Invalid referral code');
    expect(input).toHaveAttribute(
      'aria-describedby',
      'money-referral-code-error',
    );
    expect(
      document.querySelector('[data-testid="money-referral-accept"]'),
    ).toBeDisabled();
  });

  it('keeps the invite mounted when referral me settles without a payload', async () => {
    mockReferralState.referralMe = null;
    mockReferralState.isSettled = true;
    const onClose = jest.fn();
    const view = renderSheet({ onClose });

    await act(async () => undefined);
    expect(onClose).not.toHaveBeenCalled();
    expect(view.getByTestId('money-referral-invite')).toBeInTheDocument();
    expect(
      view.getByText(messages.rewardsMoneyReferralCodeLabel.message),
    ).toBeInTheDocument();
    expect(
      view.getByRole('button', { name: messages.continue.message }),
    ).toBeInTheDocument();
    expect(
      view.getByRole('button', { name: messages.musdEducationNotNow.message }),
    ).toBeInTheDocument();
    expect(view.queryByText('Invite title')).not.toBeInTheDocument();
    expect(view.queryByText('Invite body')).not.toBeInTheDocument();
    expect(trackedTypes()).not.toContain('viewed');
  });

  it.each<'REFERRER' | 'REFEREE'>(['REFERRER', 'REFEREE'])(
    'auto-dismisses a %s without a viewed event',
    async (role) => {
      mockReferralState.referralMe = buildReferralMe({
        roles: [role],
        // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
        ui_variant: role,
      });
      const onClose = jest.fn();
      renderSheet({ onClose });

      await act(async () => undefined);
      expect(onClose).toHaveBeenCalled();
      expect(trackedTypes()).not.toContain('viewed');
      expect(document.body).not.toHaveTextContent('Invite title');
    },
  );

  it('lets a cashback experiment accept an invite', async () => {
    mockReferralState.referralMe = buildReferralMe({
      roles: ['CASHBACK_EXPERIMENT'],
      // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
      ui_variant: 'REFEREE',
    });
    const onClose = jest.fn();
    renderSheet({ onClose });

    await act(async () => undefined);
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body).toHaveTextContent('Invite title');
    expect(trackedTypes()).toContain('viewed');
  });

  it('auto-dismisses an excluded country without a viewed event', async () => {
    const onClose = jest.fn();
    renderSheet({
      onClose,
      geoLocation: 'US-CA',
      excludedRegions: ['US'],
    });

    await act(async () => undefined);
    expect(onClose).toHaveBeenCalled();
    expect(trackedTypes()).not.toContain('viewed');
  });

  it('fails open while excluded regions are still unknown', async () => {
    renderSheet({
      geoLocation: 'US',
      excludedRegions: null,
    });

    expect(document.body).toHaveTextContent('Invite title');
    await act(async () => undefined);
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
      await user.click(
        view.getByRole('button', { name: messages.close.message }),
      );
    });
    expect(trackedTypes()).toEqual(['viewed', 'dismissed']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables Accept until Retry-After elapses after a 429', async () => {
    jest.useFakeTimers();
    try {
      mockRegister.mockRejectedValueOnce({
        data: {
          cause: {
            status: 429,
            retryAfterSeconds: 2,
            data: { status: 429, retryAfterSeconds: 2 },
          },
        },
      });
      const view = renderSheet({ initialCode: 'AB12CD' });
      const acceptButton = view.getByTestId('money-referral-accept');

      await act(async () => {
        fireEvent.click(acceptButton);
      });

      expect(acceptButton).toBeDisabled();
      const rateLimitError = view.getByText(
        messages.rewardsMoneyReferralTooManyTries.message,
      );
      expect(rateLimitError).toHaveAttribute('id', 'money-referral-code-error');
      expect(view.getByTestId('money-referral-code-input')).toHaveAttribute(
        'aria-describedby',
        'money-referral-code-error',
      );

      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      expect(acceptButton).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('records a refused accept without locking a later answer', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({
      data: { status: 409, bodyText: 'already referred' },
    });
    const onClose = jest.fn();
    const view = renderSheet({ onClose, initialCode: 'AB12CD' });

    await act(async () => {
      await user.click(view.getByTestId('money-referral-accept'));
    });

    expect(trackedTypes()).toEqual(['viewed', 'refused']);
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          /* eslint-disable @typescript-eslint/naming-convention -- analytics properties */
          interaction_type: 'refused',
          refusal_reason: 'already_referred',
          referral_code: 'AB12CD',
          /* eslint-enable @typescript-eslint/naming-convention */
        }),
      }),
    );
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      await user.click(view.getByTestId('money-referral-decline'));
    });
    expect(trackedTypes()).toEqual(['viewed', 'refused', 'declined']);
  });

  it('tracks accepted only after register succeeds and opens the activated modal', async () => {
    const user = userEvent.setup();
    mockReferralState.fetch.mockImplementation(async () => {
      mockReferralState.referralMe = buildReferralMe({
        roles: ['REFEREE'],
        // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
        ui_variant: 'REFEREE',
        /* eslint-disable @typescript-eslint/naming-convention -- money API fields */
        earn_rates: {
          cashback_rate_bps: 1000,
          cashback_earning_start: '2026-09-01T00:00:00.000Z',
          cashback_earning_end: '2026-12-01T00:00:00.000Z',
          revshare_rate_bps: null,
          revshare_earning_start: null,
          revshare_earning_end: null,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
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
    expect(view.getByRole('dialog', { name: 'Activated' })).toBeInTheDocument();
    expect(view.getByTestId('money-referral-activated-start')).toHaveFocus();
    expect(
      view.getByRole('button', { name: 'Close activated' }),
    ).toBeInTheDocument();
    expect(mockRegister).toHaveBeenCalledWith({ code: 'AB12CD' });
    expect(trackedTypes()).toContain('accepted');
    expect(document.body).toHaveTextContent(/from /u);
    expect(document.body).toHaveTextContent(/through /u);
    expect(document.body).not.toHaveTextContent('Invite title');
    expect(document.body).not.toHaveTextContent('Invite body');
  });

  it('uses the invite message when either cashback date is missing', async () => {
    const user = userEvent.setup();
    mockReferralState.fetch.mockImplementation(async () => {
      mockReferralState.referralMe = buildReferralMe({
        roles: ['REFEREE'],
        // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
        ui_variant: 'REFEREE',
      });
      return { status: 'settled' };
    });
    const view = renderSheet({ initialCode: 'AB12CD' });

    await act(async () => {
      await user.click(view.getByTestId('money-referral-accept'));
      await Promise.resolve();
    });

    expect(view.getByTestId('money-referral-activated')).toBeInTheDocument();
    expect(view.getByRole('dialog', { name: 'Activated' })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('Invite body');
    expect(document.body).not.toHaveTextContent('Cash back');
    expect(document.body).not.toHaveTextContent('for a limited time');
  });

  it('names the activated close button with the app close label when copy is missing', async () => {
    const user = userEvent.setup();
    mockReferralState.fetch.mockImplementation(async () => {
      mockReferralState.referralMe = buildReferralMe({
        roles: ['REFEREE'],
        // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
        ui_variant: 'REFEREE',
        // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
        localized_text: { ...copy, inviteAcceptedCloseA11y: '' },
      });
      return { status: 'settled' };
    });
    const view = renderSheet({ initialCode: 'AB12CD' });

    await act(async () => {
      await user.click(view.getByTestId('money-referral-accept'));
      await Promise.resolve();
    });

    expect(
      view.getByRole('button', { name: messages.close.message }),
    ).toBeInTheDocument();
  });

  it('keeps the invite open after it has shown NONE when a later read is REFEREE', async () => {
    const onClose = jest.fn();
    const view = renderSheet({ onClose });

    await act(async () => undefined);
    expect(trackedTypes()).toContain('viewed');

    mockReferralState.referralMe = buildReferralMe({
      roles: ['REFEREE'],
      // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
      ui_variant: 'REFEREE',
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
