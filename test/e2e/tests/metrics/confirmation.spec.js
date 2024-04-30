const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  unlockWallet,
  waitForAccountRendered,
  connectToDapp,
  waitForDappConnected,
  withFixtures,
  getEventPayloads,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

/**
 * This function mocks the segment API multiple times for specific payloads that we expect to
 * see when these tests are run. In this case, we are looking for 'Track Event' calls.
 * Do not use the constants from the metrics constants files, because if these change we want a
 * strong indicator to our data team that the shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */
async function mockTrackEvent(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/track')
      .withJsonBodyIncluding({
        event: 'NavNetworkSwitched',
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Track Event Test', function () {
  it('should send a track event when changing networks', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockTrackEvent,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        await connectToDapp(driver);
        await waitForDappConnected(driver);

        // TODO: TRIGGER NETWORK SWITCH

        await driver.navigate();
        await driver.clickElement('#network-switch-modal');

        // Triggering the event
        await driver.clickElement('#confirm-switch-button');

        // Verifying the track event
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 1);
        assert.deepStrictEqual(events[0].properties, {
          location: 'Switch Modal',
          from_network: '0x1',
          to_network: '0x2',
          referrer: { url: window.location.origin },
        });
      },
    );
  });
});
