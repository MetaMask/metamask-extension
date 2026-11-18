import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import log from 'loglevel';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import { tEn } from '../../lib/i18n-helpers';
import { integrationTestRender } from '../../lib/render-helpers';
import * as backgroundConnection from '../../../ui/store/background-connection';
import mockMetaMaskState from '../data/integration-init-state.json';
import {
  clickElementById,
  clickElementByText,
  createMockImplementation,
  waitForElementById,
} from '../helpers';

jest.setTimeout(20_000);

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

const mockedBackgroundConnection = jest.mocked(backgroundConnection);

const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};

const OAuthMethods = {
  setMarketingConsent: 'OAuthService:setMarketingConsent',
  getMarketingConsent: 'OAuthService:getMarketingConsent',
} as const;

const backgroundMethods = {
  optInToMarketing: 'AnalyticsController:optInToMarketing',
  optOutOfMarketing: 'AnalyticsController:optOutOfMarketing',
  trackAnalyticsEvent: 'trackAnalyticsEvent',
};

const selectors = {
  accountOptionsMenuButton: 'account-options-menu-button',
  settingsMenuItem: 'global-menu-settings',
  privacySettingsTab: 'settings-tab-item-privacy',
  marketingConsentToggleInput: 'data-collection-for-marketing-input',
};

const baseBackgroundMock = createMockImplementation({});

const setupSubmitRequestToBackgroundMocks = ({
  marketingConsentWriteFails = false,
}: { marketingConsentWriteFails?: boolean } = {}) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    (method: string, ...args: unknown[]) => {
      if (method === OAuthMethods.setMarketingConsent) {
        return marketingConsentWriteFails
          ? Promise.reject(new Error('Failed to post marketing opt in status'))
          : Promise.resolve(true);
      }
      return baseBackgroundMock(method);
    },
  );
};

const getSocialLoginState = (overrides: Record<string, unknown> = {}) => ({
  ...mockMetaMaskState,
  firstTimeFlowType: FirstTimeFlowType.socialCreate,
  useExternalServices: true,
  consentDecisionMade: true,
  optedIn: true,
  analyticsId: 'test-metametrics-id',
  // A social-login user who already opted in to marketing; individual tests
  // override this to model the state they need.
  marketingConsentDecisionMade: true,
  optedInToMarketing: true,
  ...overrides,
});

const flushPendingAsyncWork = async () => {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
};

const getBackgroundCalls = (method: string) =>
  mockedBackgroundConnection.submitRequestToBackground.mock.calls.filter(
    (call) => call[0] === method,
  );

const getAnalyticsPreferenceEvents = () =>
  mockedBackgroundConnection.submitRequestToBackground.mock.calls.filter(
    (call) =>
      call[0] === backgroundMethods.trackAnalyticsEvent &&
      call[1]?.[0]?.name === MetaMetricsEventName.AnalyticsPreferenceSelected,
  );

const expectMarketingConsentEvent = async (
  hasMarketingConsent: boolean,
  location: string,
  category: MetaMetricsEventCategory,
) => {
  const getMatchingEvents = () =>
    getAnalyticsPreferenceEvents().filter(
      (call) =>
        call[1]?.[0]?.properties?.[MetaMetricsUserTrait.HasMarketingConsent] ===
          hasMarketingConsent &&
        call[1]?.[0]?.properties?.location === location,
    );

  await waitFor(() => {
    expect(getMatchingEvents().length).toBeGreaterThan(0);
  });

  expect(getMatchingEvents()[0][1]?.[0]?.properties).toMatchObject({
    category,
    [MetaMetricsUserTrait.HasMarketingConsent]: hasMarketingConsent,
    location,
  });
};

const expectToggleValue = async (expected: 'true' | 'false') => {
  await waitFor(() => {
    expect(
      screen.getByTestId(selectors.marketingConsentToggleInput),
    ).toHaveAttribute('value', expected);
  });
};

const openPrivacySettings = async () => {
  await clickElementById(selectors.accountOptionsMenuButton);
  await clickElementById(selectors.settingsMenuItem);
  await waitForElementById(selectors.privacySettingsTab);
  await clickElementById(selectors.privacySettingsTab);
  await waitForElementById(selectors.marketingConsentToggleInput);
};

describe('Marketing Consent', () => {
  beforeAll(() => {
    // The failure-path tests intentionally exercise the error logging in the
    // setMarketingConsent action; silence loglevel so the expected errors do
    // not pollute the console baseline for this file.
    log.setLevel(log.levels.SILENT);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    setupSubmitRequestToBackgroundMocks();
  });

  afterEach(() => {
    window.location.hash = '#/'; // return to homescreen
  });

  describe('Data collection toggle in privacy settings', () => {
    it('keeps the toggle off after the user opts out while the OAuth marketing consent write fails', async () => {
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
      });

      await integrationTestRender({
        preloadedState: getSocialLoginState(),
        backgroundConnection: backgroundConnectionMocked,
      });

      await openPrivacySettings();
      await expectToggleValue('true');

      await clickElementById(selectors.marketingConsentToggleInput);

      // The local decision is applied...
      await expectToggleValue('false');
      expect(
        getBackgroundCalls(backgroundMethods.optOutOfMarketing),
      ).toHaveLength(1);
      // ...the failed write is still attempted with the new value...
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        1,
      );
      expect(
        getBackgroundCalls(OAuthMethods.setMarketingConsent)[0][1],
      ).toEqual([false]);
      // ...and the mount-time read that used to revert the local choice is gone.
      expect(getBackgroundCalls(OAuthMethods.getMarketingConsent)).toHaveLength(
        0,
      );

      await expectMarketingConsentEvent(
        false,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );

      // Let every pending promise chain settle; the toggle must not snap back.
      await flushPendingAsyncWork();
      await expectToggleValue('false');
    });

    it('keeps the toggle off after the user opts out while the OAuth marketing consent write succeeds', async () => {
      await integrationTestRender({
        preloadedState: getSocialLoginState(),
        backgroundConnection: backgroundConnectionMocked,
      });

      await openPrivacySettings();
      await expectToggleValue('true');

      await clickElementById(selectors.marketingConsentToggleInput);

      await expectToggleValue('false');
      expect(
        getBackgroundCalls(backgroundMethods.optOutOfMarketing),
      ).toHaveLength(1);
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        1,
      );
      expect(
        getBackgroundCalls(OAuthMethods.setMarketingConsent)[0][1],
      ).toEqual([false]);

      await expectMarketingConsentEvent(
        false,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );

      await flushPendingAsyncWork();
      await expectToggleValue('false');
    });

    it('keeps the toggle on after the user opts in while the OAuth marketing consent write fails', async () => {
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
      });

      await integrationTestRender({
        preloadedState: getSocialLoginState({
          optedInToMarketing: false,
        }),
        backgroundConnection: backgroundConnectionMocked,
      });

      await openPrivacySettings();
      await expectToggleValue('false');

      await clickElementById(selectors.marketingConsentToggleInput);

      await expectToggleValue('true');
      expect(
        getBackgroundCalls(backgroundMethods.optInToMarketing),
      ).toHaveLength(1);
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        1,
      );
      expect(
        getBackgroundCalls(OAuthMethods.setMarketingConsent)[0][1],
      ).toEqual([true]);

      await expectMarketingConsentEvent(
        true,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );

      await flushPendingAsyncWork();
      await expectToggleValue('true');
    });

    it('does not sync marketing consent with the OAuth backend for SRP users', async () => {
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
      });

      await integrationTestRender({
        preloadedState: getSocialLoginState({
          firstTimeFlowType: FirstTimeFlowType.create,
        }),
        backgroundConnection: backgroundConnectionMocked,
      });

      await openPrivacySettings();
      await expectToggleValue('true');

      await clickElementById(selectors.marketingConsentToggleInput);

      await expectToggleValue('false');
      expect(
        getBackgroundCalls(backgroundMethods.optOutOfMarketing),
      ).toHaveLength(1);
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        0,
      );
      expect(getBackgroundCalls(OAuthMethods.getMarketingConsent)).toHaveLength(
        0,
      );
    });
  });

  describe('Marketing consent modal on home', () => {
    const openConsentModal = async (
      overrides: Record<string, unknown> = {},
    ) => {
      await integrationTestRender({
        preloadedState: getSocialLoginState({
          marketingConsentDecisionMade: false,
          optedInToMarketing: false,
          ...overrides,
        }),
        backgroundConnection: backgroundConnectionMocked,
      });

      await screen.findByText(tEn('onboardedMetametricsTitle'));
    };

    it('keeps the opt-in decision when the OAuth write fails after accepting the consent modal', async () => {
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
      });

      await openConsentModal();

      await clickElementByText(tEn('onboardedMetametricsAccept'));

      // The modal closes because the local decision was applied...
      await waitFor(() => {
        expect(
          screen.queryByText(tEn('onboardedMetametricsTitle')),
        ).not.toBeInTheDocument();
      });
      expect(
        getBackgroundCalls(backgroundMethods.optInToMarketing),
      ).toHaveLength(1);
      // ...the failed write is still attempted with the accepted value...
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        1,
      );
      expect(
        getBackgroundCalls(OAuthMethods.setMarketingConsent)[0][1],
      ).toEqual([true]);

      await expectMarketingConsentEvent(
        true,
        'marketing_consent_modal',
        MetaMetricsEventCategory.Home,
      );

      // Let every pending promise chain settle; the modal must not come back.
      await flushPendingAsyncWork();
      expect(
        screen.queryByText(tEn('onboardedMetametricsTitle')),
      ).not.toBeInTheDocument();
    });

    it('records the opt-out when the user declines the consent modal while the OAuth write fails', async () => {
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
      });

      await openConsentModal();

      await clickElementByText(tEn('onboardedMetametricsDisagree'));

      await waitFor(() => {
        expect(
          screen.queryByText(tEn('onboardedMetametricsTitle')),
        ).not.toBeInTheDocument();
      });
      expect(
        getBackgroundCalls(backgroundMethods.optOutOfMarketing),
      ).toHaveLength(1);
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        1,
      );
      expect(
        getBackgroundCalls(OAuthMethods.setMarketingConsent)[0][1],
      ).toEqual([false]);

      await expectMarketingConsentEvent(
        false,
        'marketing_consent_modal',
        MetaMetricsEventCategory.Home,
      );

      await flushPendingAsyncWork();
      expect(
        screen.queryByText(tEn('onboardedMetametricsTitle')),
      ).not.toBeInTheDocument();
    });

    it('does not post marketing consent to the OAuth backend for SRP users', async () => {
      await openConsentModal({
        firstTimeFlowType: FirstTimeFlowType.create,
      });

      await clickElementByText(tEn('onboardedMetametricsAccept'));

      await waitFor(() => {
        expect(
          screen.queryByText(tEn('onboardedMetametricsTitle')),
        ).not.toBeInTheDocument();
      });
      expect(
        getBackgroundCalls(backgroundMethods.optInToMarketing),
      ).toHaveLength(1);
      expect(getBackgroundCalls(OAuthMethods.setMarketingConsent)).toHaveLength(
        0,
      );
      expect(getBackgroundCalls(OAuthMethods.getMarketingConsent)).toHaveLength(
        0,
      );
    });
  });
});
