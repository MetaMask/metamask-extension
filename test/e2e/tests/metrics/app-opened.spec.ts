import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import { MOCK_META_METRICS_ID } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';

/**
 * Mocks the segment API for the App Opened event that we expect to see when
 * these tests are run.
 *
 * @param mockServer - The mock server instance.
 * @returns The mocked endpoints
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'App Opened' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('App Opened metric', function () {
  it('should send AppOpened metric when app is opened and metrics are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].properties.category, 'App');
      },
    );
  });

  it('should not send AppOpened metric when metrics are disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
      },
    );
  });

  it('should send AppOpened metric when dapp opens MetaMask', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await login(driver);

        // Go to dapp which will trigger MetaMask to open
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        // Wait for events to be tracked
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].properties.category, 'App');
      },
    );
  });
});
