const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  switchToNotificationWindow,
  withFixtures,
  openDapp,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * 'Permissions Requested' and 'Permissions Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */
async function mockSegment(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Permissions Requested' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Permissions Approved' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

/**
 * This method handles getting the mocked requests to the segment server
 *
 * @param {WebDriver} driver
 * @param {import('mockttp').Mockttp} mockedEndpoints
 * @returns {import('mockttp/dist/pluggable-admin').MockttpClientResponse[]}
 */
async function getEventPayloads(driver, mockedEndpoints) {
  await driver.wait(async () => {
    let isPending = true;
    for (const mockedEndpoint of mockedEndpoints) {
      isPending = await mockedEndpoint.isPending();
    }
    return isPending === false;
  }, 10000);
  const mockedRequests = [];
  for (const mockedEndpoint of mockedEndpoints) {
    mockedRequests.push(...(await mockedEndpoint.getSeenRequests()));
  }
  return mockedRequests.map((req) => req.body.json.batch).flat();
}

describe('Permissions Approved Event', function () {
  it('Successfully tracked when connecting to dapp', async function () {
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
        title: this.test.title,
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await openDapp(driver);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await switchToNotificationWindow(driver);
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          method: 'eth_requestAccounts',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].properties, {
          method: 'eth_requestAccounts',
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
