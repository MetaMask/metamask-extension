const { strict: assert } = require('assert');
const {
  connectToDapp,
  withFixtures,
  unlockWallet,
  getEventPayloads,
  openDapp,
  logInWithBalanceValidation,
  WINDOW_TITLES,
  defaultGanacheOptions,
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
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-add-account"]',
  );
  await driver.fill('[placeholder="Account 2"]', '2nd account');
  await driver.clickElement({ text: 'Add account', tag: 'button' });
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
  const validFakeMetricsId = 'fake-metrics-fd20';
  it('is not sent when metametrics ID is not valid', async function () {
    async function mockSegment(mockServer) {
      return [await mockedDappViewedEndpoint(mockServer)];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'invalid-metrics-id',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);
        await connectToDapp(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 0);
      },
    );
  });

  it('is sent when navigating to dapp with no account connected', async function () {
    async function mockSegment(mockServer) {
      return [await mockedDappViewedEndpoint(mockServer)];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId, // 1% sample rate for dapp viewed event
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
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
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
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
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
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
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
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

  it('is sent when reconnect to a dapp that has been connected before', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedDappViewedEndpoint(mockServer),
        await mockedDappViewedEndpoint(mockServer),
      ];
    }

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: validFakeMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
        ganacheOptions: defaultGanacheOptions,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await connectToDapp(driver);
        await waitForDappConnected(driver);

        // close test dapp window to avoid future confusion
        const windowHandles = await driver.getAllWindowHandles();
        await driver.closeWindowHandle(windowHandles[1]);
        // disconnect dapp in fullscreen view
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({
          text: 'All Permissions',
          tag: 'div',
        });
                await driver.clickElementAndWaitToDisappear({
                  text: 'Got it',
                  tag: 'button',
                });
        await driver.clickElement({
          text: '127.0.0.1:8080',
          tag: 'p',
        });
        await driver.clickElement('[data-testid ="disconnect-all"]');
        // validate dapp is not connected
        await driver.clickElement(
          '[data-testid ="account-options-menu-button"]',
        );
        await driver.clickElement({
          text: 'All Permissions',
          tag: 'div',
        });
        // reconnect again
        await connectToDapp(driver);
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 2);
        // events are original dapp viewed, new dapp viewed when reconnected
        const dappViewedEventProperties = events[1].properties;
        assert.equal(dappViewedEventProperties.is_first_visit, false);
        assert.equal(dappViewedEventProperties.number_of_accounts, 1);
        assert.equal(dappViewedEventProperties.number_of_accounts_connected, 1);
      },
    );
  });
});
