import React from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import nock from 'nock';
import state from '../data/onboarding-completion-route.json';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { createMockImplementation } from '../helpers';

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

// Rive cannot initialize its canvas/WASM runtime in jsdom.
jest.mock(
  '../../../ui/pages/onboarding-flow/welcome/fox-appear-animation',
  () => ({
    __esModule: true,
    default: () => <div />,
  }),
);
jest.mock(
  '../../../ui/pages/onboarding-flow/welcome/metamask-wordmark-animation',
  () => ({
    __esModule: true,
    default: () => <div />,
  }),
);

describe('Referral handoff with the application router', () => {
  afterEach(() => {
    nock.cleanAll();
    window.location.hash = '';
  });

  it('renders the real invite then resumes the original destination on decline', async () => {
    const context = {
      id: 'offer-1',
      url: 'https://link.metamask.io/home?ref=ABC',
      code: 'ABC',
      entryType: 'restored_context',
      requiresInterstitial: false,
    };
    const fallback = createMockImplementation({});
    jest
      .mocked(backgroundConnection.submitRequestToBackground)
      .mockImplementation(async (action: string, args?: unknown[]) => {
        const method = action === 'messengerCall' ? String(args?.[0]) : action;
        if (method === 'RewardsMoneyController:takeReferralContext') {
          return context;
        }
        if (method === 'RewardsMoneyController:getReferralMe') {
          return {
            roles: [],
            ui_variant: 'NONE',
            excluded_regions: [],
            earn_rates: {},
            invite_hero: null,
            localized_text: {
              inviteTitle: 'Referral invite',
              inviteMessageBody: 'Referral body',
              inviteReferralCode: 'Code',
              inviteAccept: 'Accept invite',
              inviteDecline: 'Decline invite',
            },
          };
        }
        if (method === 'RewardsMoneyController:validateReferralCode') {
          return { success: true };
        }
        if (method === 'RewardsController:getGeoRewardsMetadata') {
          return { geoLocation: 'GB', optinAllowedForGeo: true };
        }
        return fallback(method);
      });
    window.location.hash = `#/referral-invite?context=offer-1&u=${encodeURIComponent(context.url)}`;
    await integrationTestRender({
      preloadedState: {
        ...state,
        completedOnboarding: true,
        isUnlocked: true,
        termsOfUseLastAgreed: Date.now(),
        excludedRegions: [],
      },
      backgroundConnection: {
        onNotification: jest.fn(),
        submitRequestToBackground: jest.fn(),
      },
    });
    expect(await screen.findByTestId('money-referral-code-input')).toHaveValue(
      'ABC',
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('money-referral-decline'));
    });
    await waitFor(() => {
      expect(window.location.hash).toBe('#/');
    });
    expect(
      jest
        .mocked(backgroundConnection.submitRequestToBackground)
        .mock.calls.some(
          ([action, args]) =>
            action === 'RewardsMoneyController:registerReferee' ||
            (action === 'messengerCall' &&
              args?.[0] === 'RewardsMoneyController:registerReferee'),
        ),
    ).toBe(false);
  });
});
