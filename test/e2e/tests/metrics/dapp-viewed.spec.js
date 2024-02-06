const { strict: assert } = require('assert');
const {
  connectToDapp,
  withFixtures,
  unlockWallet,
  getEventPayloads,
  openDapp,
  waitForAccountRendered,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const {
  MetaMetricsEventName,
} = require('../../../../shared/constants/metametrics');

async function mockedDappViewedEndpoint(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: MetaMetricsEventName.DappViewed }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockPermissionApprovedEndpoint(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Permissions Approved' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function createTwoAccounts(driver) {
  await waitForAccountRendered(driver);
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-add-account"]',
  );
  await driver.fill('[placeholder="Account 2"]', '2nd account');
  await driver.clickElement({ text: 'Create', tag: 'button' });
  await driver.findElement({
    css: '[data-testid="account-menu-icon"]',
    text: '2nd account',
  });
}

const waitForDappConnected = async (driver) => {
  await driver.waitForSelector({
    css: '#accounts',
    text: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  });
};

describe('Dapp viewed Event @no-mmi', function () {
  it('is sent when navigating to dapp with no account connected', async function () {
    async function mockSegment(mockServer) {
      return [await mockedDappViewedEndpoint(mockServer)];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);

        await connectToDapp(driver);
        await waitForDappConnected(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        const dappViewedEventProperties = events[0].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, true);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when opening the dapp in a new tab with one account connected', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedDappViewedEndpoint(mockServer),
        await mockedDappViewedEndpoint(mockServer),
        await mockPermissionApprovedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        await connectToDapp(driver);
        await waitForDappConnected(driver);
        // open dapp in a new page
        await openDapp(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        // events are original dapp viewed, new dapp viewed when refresh, and permission approved
        const dappViewedEventProperties = events[1].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when refreshing dapp with one account connected', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedDappViewedEndpoint(mockServer),
        await mockedDappViewedEndpoint(mockServer),
        await mockPermissionApprovedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        await connectToDapp(driver);
        await waitForDappConnected(driver);
        // refresh dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.refresh();

        const events = await getEventPayloads(driver, mockedEndpoints);

        // events are original dapp viewed, new dapp viewed when refresh, and permission approved
        const dappViewedEventProperties = events[1].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when navigating to a connected dapp', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedDappViewedEndpoint(mockServer),
        await mockedDappViewedEndpoint(mockServer),
        await mockedDappViewedEndpoint(mockServer),
        await mockedDappViewedEndpoint(mockServer),
        await mockPermissionApprovedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await waitForAccountRendered(driver);
        await connectToDapp(driver);
        await waitForDappConnected(driver);
        // open dapp in a new page
        await openDapp(driver);
        const windowHandles = await driver.getAllWindowHandles();
        // switch to second connected dapp
        await driver.switchToWindow(windowHandles[1]);
        await driver.switchToWindow(windowHandles[2]);
        const events = await getEventPayloads(driver, mockedEndpoints);
        // events are original dapp viewed, navigate to dapp, new dapp viewed when refresh, new dapp viewed when navigate and permission approved
        const dappViewedEventProperties = events[2].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });

  it('is sent when connecting dapp with two accounts', async function () {
    async function mockSegment(mockServer) {
      return [await mockedDappViewedEndpoint(mockServer)];
    }
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        // create 2nd account
        await createTwoAccounts(driver);
        // Connect to dapp with two accounts
        await openDapp(driver);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });
        await driver.waitUntilXWindowHandles(3);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement(
          '[data-testid="choose-account-list-operate-all-check-box"]',
        );

        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        const dappViewedEventProperties = events[0].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, true);
        assert.equal(dappViewedEventProperties.number_of_accounts, 2);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 2);
      },
    );
  });
});
