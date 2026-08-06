import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import {
  getCleanAppState,
  getEventPayloads,
  withFixtures,
} from '../../helpers';
import { MOCK_ANALYTICS_ID } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import ErrorPage from '../../page-objects/pages/error-page';
import { triggerCrash } from '../../page-objects/flows/crash.flow';
import { login } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import {
  BASE_ACCOUNT_SYNC_INTERVAL,
  BASE_ACCOUNT_SYNC_TIMEOUT,
} from '../identity/account-syncing/helpers';
import { mockIdentityServices } from '../identity/mocks';

/**
 * Mocks the segment API for events tracked from the error page.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked endpoints
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Support Link Clicked' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

/**
 * Mocks Segment and authentication services needed to fetch a customer-service token.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked Segment endpoints
 */
async function mockSupportLinkConsentMetrics(mockServer: Mockttp) {
  const segmentMocks = await mockSegment(mockServer);
  await mockIdentityServices(mockServer);
  return segmentMocks;
}

/**
 * Waits until AuthenticationController reports the user is signed in.
 *
 * @param driver - The webdriver instance.
 */
async function waitForSignedInAuth(driver: Driver): Promise<void> {
  console.log('Waiting for authentication sign-in to complete');
  await driver.waitUntil(
    async () => {
      const uiState = await getCleanAppState(driver);
      return uiState?.metamask?.isSignedIn === true;
    },
    {
      interval: BASE_ACCOUNT_SYNC_INTERVAL,
      timeout: BASE_ACCOUNT_SYNC_TIMEOUT,
    },
  );
}

describe('Error Page', function () {
  it('sends "Support Link Click" event with customer_service_token when user consents', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSupportLinkConsentMetrics,
        ignoredConsoleErrors: [
          'Unable to find value of key "debug" for locale "en"',
        ],
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver, { waitForNonEvmAccounts: false });
        await waitForSignedInAuth(driver);

        await triggerCrash(driver);

        const errorPage = new ErrorPage(driver);
        await errorPage.checkPageIsLoaded();

        await errorPage.clickContactButton();
        await errorPage.consentDataToMetamaskSupport();

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        const metricEvent = events[0];
        assert.equal(metricEvent.event, 'Support Link Clicked');
        const trackedUrl = metricEvent.properties.url;
        const queryString = new URL(trackedUrl).search;
        assert.match(
          queryString,
          /customer_service_token/u,
          'Customer service token missing from tracked URL when user consents',
        );
      },
    );
  });

  it('sends "Support Link Click" event without customer_service_token when user does not consent', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            analyticsId: MOCK_ANALYTICS_ID,
            completedMetaMetricsOnboarding: true,
            optedIn: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
        ignoredConsoleErrors: [
          'Unable to find value of key "debug" for locale "en"',
        ],
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);
        await triggerCrash(driver);

        const errorPage = new ErrorPage(driver);
        await errorPage.checkPageIsLoaded();

        await errorPage.clickContactButton();
        await errorPage.rejectDataToMetamaskSupport();

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        const metricEvent = events[0];
        assert.equal(metricEvent.event, 'Support Link Clicked');
        const trackedUrl = metricEvent.properties.url;
        const queryString = new URL(trackedUrl).search;
        // Non-personal attribution params like utm_source should be preserved
        assert.match(
          queryString,
          /utm_source=extension/u,
          'Non-personal attribution parameter missing from tracked URL',
        );
        // Personal data should NOT be present when user does not consent
        assert.doesNotMatch(
          queryString,
          /customer_service_token/u,
          'Customer service token should not be in tracked URL when user does not consent',
        );
        assert.doesNotMatch(
          queryString,
          /metamask_metametrics_id/u,
          'Personal data should not be in tracked URL when user does not consent',
        );
      },
    );
  });
});
