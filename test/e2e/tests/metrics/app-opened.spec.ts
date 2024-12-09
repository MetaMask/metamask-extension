import { strict as assert } from 'assert';
import { Mockttp } from 'mockttp';
import {
  withFixtures,
  getEventPayloads,
  unlockWallet,
  connectToDapp,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

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

describe('App Opened metric @no-mmi', function () {
  it('should send AppOpened metric when app is opened and metrics are enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-fd20',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await loginWithoutBalanceValidation(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].properties.category, 'App');
      },
    );
  });

  it('should not send AppOpened metric when metrics are disabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-fd20',
            participateInMetaMetrics: false,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
      },
    );
  });

  it('should send AppOpened metric when dapp opens MetaMask', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-fd20',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        // Connect to dapp which will trigger MetaMask to open
        await connectToDapp(driver);

        // Wait for events to be tracked
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.equal(events[0].properties.category, 'App');
      },
    );
  });
});
