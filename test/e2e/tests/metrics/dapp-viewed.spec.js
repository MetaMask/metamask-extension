const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  connectToDapp,
  withFixtures,
  unlockWallet,
  getEventPayloads,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const {
  MetaMetricsEventName,
} = require('../../../../shared/constants/metametrics');

async function mockSegment(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: MetaMetricsEventName.DappViewed }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Dapp viewed Event', function () {
  it('Successfully tracked when navigating to dapp with no account connected @no-mmi', async function () {
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
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await connectToDapp(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);

        assert.deepStrictEqual(events[0].properties, {
          category: 'inpage_provider',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
          is_first_visit: true,
          number_of_accounts: 1,
          number_of_accounts_connected: 1,
        });
      },
    );
  });
});
