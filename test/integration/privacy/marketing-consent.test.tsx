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

const selectors = {
  accountOptionsMenuButton: 'account-options-menu-button',
  settingsMenuItem: 'global-menu-settings',
  privacySettingsTab: 'settings-tab-item-privacy',
  marketingConsentToggleInput: 'data-collection-for-marketing-input',
};

const baseBackgroundMock = createMockImplementation({});

const setupSubmitRequestToBackgroundMocks = ({
  marketingConsentWriteFails = false,
  marketingConsentRead = Promise.resolve(false),
}: {
  marketingConsentWriteFails?: boolean;
  marketingConsentRead?: Promise<boolean>;
} = {}) => {
  mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
    (method: string) => {
      if (method === 'OAuthService:setMarketingConsent') {
        return marketingConsentWriteFails
          ? Promise.reject(new Error('Failed to post marketing opt in status'))
          : Promise.resolve(true);
      }
      if (method === 'OAuthService:getMarketingConsent') {
        return marketingConsentRead;
      }
      return baseBackgroundMock(method);
    },
  );
};

const createDeferred = <Type,>() => {
  let resolve: (value: Type) => void = () => undefined;
  const promise = new Promise<Type>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

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

const flushPendingAsyncWork = async () => {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
};

const getBackgroundCalls = (method: string) =>
  mockedBackgroundConnection.submitRequestToBackground.mock.calls.filter(
    (call) => call[0] === method,
  );

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
  beforeAll(() => {
    // Silence expected error logs from the failure-path mocks.
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
    it('keeps the toggle off when a social login user opts out and the OAuth marketing consent write fails', async () => {
      const staleServerConsentRead = createDeferred<boolean>();
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
        marketingConsentRead: staleServerConsentRead.promise,
      });

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
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent')[0][1],
      ).toEqual([false]);
      expect(
        getBackgroundCalls('OAuthService:getMarketingConsent'),
      ).toHaveLength(0);

      await expectMarketingConsentEvent(
        false,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );

      staleServerConsentRead.resolve(true);
      await flushPendingAsyncWork();
      await expectToggleValue('false');
    });

    it('keeps the toggle off when a social login user opts out and the OAuth marketing consent write succeeds', async () => {
      const staleServerConsentRead = createDeferred<boolean>();
      setupSubmitRequestToBackgroundMocks({
        marketingConsentRead: staleServerConsentRead.promise,
      });

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
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent')[0][1],
      ).toEqual([false]);

      await expectMarketingConsentEvent(
        false,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );

      staleServerConsentRead.resolve(true);
      await flushPendingAsyncWork();
      await expectToggleValue('false');
    });

    it('keeps the toggle on when a social login user opts in and the OAuth marketing consent write fails', async () => {
      const staleServerConsentRead = createDeferred<boolean>();
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
        marketingConsentRead: staleServerConsentRead.promise,
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
        getBackgroundCalls('AnalyticsController:optInToMarketing'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent')[0][1],
      ).toEqual([true]);
      expect(
        getBackgroundCalls('OAuthService:getMarketingConsent'),
      ).toHaveLength(0);

      await expectMarketingConsentEvent(
        true,
        'Settings',
        MetaMetricsEventCategory.Settings,
      );

      staleServerConsentRead.resolve(false);
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
        getBackgroundCalls('AnalyticsController:optOutOfMarketing'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(0);
      expect(
        getBackgroundCalls('OAuthService:getMarketingConsent'),
      ).toHaveLength(0);
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

    it('keeps the opt-in decision when the OAuth write fails after the consent modal is accepted', async () => {
      setupSubmitRequestToBackgroundMocks({
        marketingConsentWriteFails: true,
      });

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
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent')[0][1],
      ).toEqual([true]);

      await expectMarketingConsentEvent(
        true,
        'marketing_consent_modal',
        MetaMetricsEventCategory.Home,
      );

      await flushPendingAsyncWork();
      expect(
        screen.queryByText(tEn('onboardedMetametricsTitle')),
      ).not.toBeInTheDocument();
    });

    it('records the opt-out when the consent modal is declined while the OAuth write fails', async () => {
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
        getBackgroundCalls('AnalyticsController:optOutOfMarketing'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent')[0][1],
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
        getBackgroundCalls('AnalyticsController:optInToMarketing'),
      ).toHaveLength(1);
      expect(
        getBackgroundCalls('OAuthService:setMarketingConsent'),
      ).toHaveLength(0);
      expect(
        getBackgroundCalls('OAuthService:getMarketingConsent'),
      ).toHaveLength(0);
    });
  });
});
