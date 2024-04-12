const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');

const {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
  getEventPayloads,
} = require('../../helpers');

async function mockServerCalls(mockServer) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Settings Updated',
            properties: {
              blockaid_alerts_enabled: true,
              category: 'Settings',
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [
          {
            type: 'track',
            event: 'Settings Updated',
            properties: {
              blockaid_alerts_enabled: false,
              category: 'Settings',
            },
          },
        ],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('PPOM Blockaid Alert - Metrics @no-mmi', function () {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('Successfully track button toggle on/off', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withPermissionControllerConnectedToTestDapp()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockServerCalls,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);

        // toggle on
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });
        await driver.clickElement(
          '[data-testid="settings-toggle-security-alert-blockaid"] .toggle-button > div',
        );

        await driver.delay(1000);

        // toggle off
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });
        await driver.clickElement(
          '[data-testid="settings-toggle-security-alert-blockaid"] .toggle-button > div',
        );

        const events = await getEventPayloads(driver, mockedEndpoints);

        const toggleOnEvent = {
          event: 'Settings Updated',
          properties: {
            blockaid_alerts_enabled: true,
            category: 'Settings',
          },
          userId: 'fake-metrics-id',
          type: 'track',
        };
        const matchToggleOnEvent = {
          event: events[0].event,
          properties: {
            blockaid_alerts_enabled:
              events[0].properties.blockaid_alerts_enabled,
            category: events[0].properties.category,
          },
          userId: events[0].userId,
          type: events[0].type,
        };

        const toggleOffEvent = {
          event: 'Settings Updated',
          properties: {
            blockaid_alerts_enabled: false,
            category: 'Settings',
          },
          userId: 'fake-metrics-id',
          type: 'track',
        };
        const matchToggleOffEvent = {
          event: events[1].event,
          properties: {
            blockaid_alerts_enabled:
              events[1].properties.blockaid_alerts_enabled,
            category: events[1].properties.category,
          },
          userId: events[1].userId,
          type: events[1].type,
        };

        assert.equal(events.length, 2);
        assert.deepEqual(toggleOnEvent, matchToggleOnEvent);
        assert.deepEqual(toggleOffEvent, matchToggleOffEvent);
      },
    );
  });
});
