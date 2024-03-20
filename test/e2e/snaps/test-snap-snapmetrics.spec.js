const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  getEventPayloads,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

/**
 * mocks the segment api multiple times for specific payloads that we expect to
 * see when these tests are run. In this case we are looking for
 * Snap Metrics. Do not use the constants from the metrics constants files,
 * because if these change we want a strong indicator to our data team that the
 * shape of data will change.
 *
 * @param {import('mockttp').Mockttp} mockServer
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse>[]}
 */

async function mockedSnapInstall(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Installed' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedSnapInstallRejected(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Update Rejected' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedSnapUninstall(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Uninstalled' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

describe('Test Snap Metrics', function () {
  it('tests snap install metric', async function () {
    async function mockSegment(mockServer) {
      return [await mockedSnapInstall(mockServer)];
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

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications card and click first
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'https://metamask.github.io',
          version: '2.1.1',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('tests snap install rejected metric', async function () {
    async function mockSegment(mockServer) {
      return [await mockedSnapInstallRejected(mockServer)];
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

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications card and click first
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement({
          text: 'Cancel',
          tag: 'button',
        });

        // check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('tests snap uninstall metric', async function () {
    async function mockSegment(mockServer) {
      return [await mockedSnapUninstall(mockServer)];
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

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications card and click first
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);
        await driver.delay(1000);
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension and click connect
        const windowHandles = await driver.waitUntilXWindowHandles(
          3,
          1000,
          10000,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.Dialog,
          windowHandles,
        );
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'Install' });

        await driver.clickElement({
          text: 'Install',
          tag: 'button',
        });

        await driver.waitForSelector({ text: 'OK' });

        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch to the original MM tab
        const extensionPage = windowHandles[0];
        await driver.switchToWindow(extensionPage);

        // click on the global action menu
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // try to click on the snaps item
        await driver.clickElement({
          text: 'Snaps',
          tag: 'div',
        });

        // try to disable the snap
        await driver.waitForSelector({
          text: 'Notifications Example Snap',
          tag: 'p',
        });
        await driver.clickElement({
          text: 'Notifications Example Snap',
          tag: 'p',
        });

        // try to remove snap
        await driver.clickElement({
          text: 'Remove Notifications Example Snap',
          tag: 'p',
        });

        // try to click remove on popover
        await driver.waitForSelector('#popoverRemoveSnapButton');
        await driver.clickElement('#popoverRemoveSnapButton');

        // check the results of the removal
        await driver.waitForSelector({
          css: '.mm-box',
          text: "You don't have any snaps installed.",
          tag: 'p',
        });

        // check that snap uninstalled event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          version: '2.1.1',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
