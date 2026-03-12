import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import { MOCK_META_METRICS_ID } from '../../constants';
import FixtureBuilder from '../../fixtures/fixture-builder';
import ErrorPage from '../../page-objects/pages/error-page';
import { triggerCrash } from '../../page-objects/flows/crash.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

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

describe('Error Page', function () {
  it('sends "Support Link Click" event with metrics ID when user consents', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
        ignoredConsoleErrors: [
          'Unable to find value of key "developerOptions" for locale "en"',
        ],
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
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
          /metamask_metametrics_id/u,
          'Metrics ID missing from tracked URL',
        );
      },
    );
  });

  it('sends "Support Link Click" event without metrics ID when user does not consent', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
        ignoredConsoleErrors: [
          'Unable to find value of key "developerOptions" for locale "en"',
        ],
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithBalanceValidation(driver);
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
        // Personal data like metrics ID should NOT be present
        assert.doesNotMatch(
          queryString,
          /metamask_metametrics_id/u,
          'Personal data should not be in tracked URL when user does not consent',
        );
      },
    );
  });
});
