import React from 'react';
import { screen, waitFor } from '@testing-library/react';
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

const selectors = {
  accountOptionsMenuButton: 'account-options-menu-button',
  settingsMenuItem: 'global-menu-settings',
  privacySettingsTab: 'settings-tab-item-privacy',
  marketingConsentToggleInput: 'data-collection-for-marketing-input',
};

const baseBackgroundMock = createMockImplementation({
  'AuthenticatedUserStorageService:getNotificationPreferences': null,
});
const getSocialLoginState = (overrides: Record<string, unknown> = {}) => ({
  ...mockMetaMaskState,
  firstTimeFlowType: FirstTimeFlowType.socialCreate,
  useExternalServices: true,
  consentDecisionMade: true,
  optedIn: true,
  analyticsId: 'test-metametrics-id',
  marketingConsentDecisionMade: true,
  optedInToMarketing: true,
  ...overrides,
});

const getBackgroundCalls = (method: string) =>
  mockedBackgroundConnection.submitRequestToBackground.mock.calls.filter(
    (call) => call[0] === method,
  );

const expectNoOAuthConsentCalls = () => {
  expect(getBackgroundCalls('OAuthService:setMarketingConsent')).toHaveLength(
    0,
  );
  expect(getBackgroundCalls('OAuthService:getMarketingConsent')).toHaveLength(
    0,
  );
};

const expectMarketingConsentEvent = async (
  hasMarketingConsent: boolean,
  location: string,
  category: MetaMetricsEventCategory,
) => {
  const getMatchingEvents = () =>
    mockedBackgroundConnection.submitRequestToBackground.mock.calls.filter(
      (call) =>
        call[0] === 'trackAnalyticsEvent' &&
        call[1]?.[0]?.name ===
          MetaMetricsEventName.AnalyticsPreferenceSelected &&
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
  beforeEach(() => {
    jest.resetAllMocks();
    mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
      baseBackgroundMock,
    );
  });

  afterEach(() => {
    window.location.hash = '#/'; // return to homescreen
  });

  describe('Data collection toggle in privacy settings', () => {
    it('opts a social login user out locally without calling the OAuth consent API', async () => {
      await integrationTestRender({
        preloadedState: getSocialLoginState(),
        backgroundConnection: backgroundConnectionMocked,
      });

      await openPrivacySettings();
      await expectToggleValue('true');

      await clickElementById(selectors.marketingConsentToggleInput);

      await expectToggleValue('false');
      expect(
        getBackgroundCalls('AnalyticsController:optOutOfMarketing'),
      ).toHaveLength(1);
      expectNoOAuthConsentCalls();

      await expectMarketingConsentEvent(
        false,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );
    });

    it('opts a social login user in locally without calling the OAuth consent API', async () => {
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
        getBackgroundCalls('AnalyticsController:optInToMarketing'),
      ).toHaveLength(1);
      expectNoOAuthConsentCalls();

      await expectMarketingConsentEvent(
        true,
        'Settings',
        MetaMetricsEventCategory.Settings,
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

    it('records the opt-in when the consent modal is accepted without calling the OAuth consent API', async () => {
      await openConsentModal();

      await clickElementByText(tEn('onboardedMetametricsAccept'));

      await waitFor(() => {
        expect(
          screen.queryByText(tEn('onboardedMetametricsTitle')),
        ).not.toBeInTheDocument();
      });
      expect(
        getBackgroundCalls('AnalyticsController:optInToMarketing'),
      ).toHaveLength(1);
      expectNoOAuthConsentCalls();

      await expectMarketingConsentEvent(
        true,
        'marketing_consent_modal',
        MetaMetricsEventCategory.Home,
      );
    });

    it('records the opt-out when the consent modal is declined without calling the OAuth consent API', async () => {
      await openConsentModal();

      await clickElementByText(tEn('onboardedMetametricsDisagree'));

      await waitFor(() => {
        expect(
          screen.queryByText(tEn('onboardedMetametricsTitle')),
        ).not.toBeInTheDocument();
      });
      expect(
        getBackgroundCalls('AnalyticsController:optOutOfMarketing'),
      ).toHaveLength(1);
      expectNoOAuthConsentCalls();

      await expectMarketingConsentEvent(
        false,
        'marketing_consent_modal',
        MetaMetricsEventCategory.Home,
      );
    });
  });
});
