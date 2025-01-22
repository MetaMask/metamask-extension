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

async function mockedSnapInstallStarted(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Install Started' }],
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
      batch: [{ type: 'track', event: 'Snap Install Rejected' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedSnapInstallFailed(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Install Failed' }],
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

async function mockedSnapUpdated(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Updated' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedSnapUpdateStarted(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Update Started' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedSnapUpdateRejected(mockServer) {
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

async function mockedSnapUpdateFailed(mockServer) {
  return await mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Update Failed' }],
    })
    .thenCallback(() => {
      return {
        statusCode: 200,
      };
    });
}

async function mockedNpmInstall(mockServer) {
  return await mockServer
    .forGet(/https:\/\/registry\.npmjs\.org/u)
    .thenCallback(() => {
      return {
        statusCode: 429,
      };
    });
}

async function mockedNpmUpdate(mockServer) {
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/bip32-example-snap/-/bip32-example-snap-0.35.2-flask.1.tgz',
    )
    .thenCallback(() => {
      return {
        statusCode: 429,
      };
    });
}

describe('Test Snap Metrics', function () {
  it('tests snap install metric', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedSnapInstallStarted(mockServer),
        await mockedSnapInstall(mockServer),
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
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications snap
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectnotifications');
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Install Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Installed');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'https://metamask.github.io',
          version: '2.3.0',
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
      return [
        await mockedSnapInstallStarted(mockServer),
        await mockedSnapInstallRejected(mockServer),
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
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications snap
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectnotifications');
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });
        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Cancel',
          tag: 'button',
        });

        // check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Install Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Install Rejected');
        assert.deepStrictEqual(events[1].properties, {
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

  it('tests snap install failed metric', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedSnapInstallStarted(mockServer),
        await mockedSnapInstallFailed(mockServer),
        await mockedNpmInstall(mockServer),
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
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the notifications snap
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectnotifications');
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for connection failure
        await driver.waitForSelector({ text: 'Connection failed' });

        // check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Install Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Install Failed');
        assert.deepStrictEqual(events[1].properties, {
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

        // find and scroll to the notifications snap
        const snapButton = await driver.findElement('#connectnotifications');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectnotifications');
        await driver.clickElement('#connectnotifications');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // switch to the original MM tab
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

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
          version: '2.3.0',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('test snap update metric', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedSnapUpdateStarted(mockServer),
        await mockedSnapUpdated(mockServer),
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
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the update snap
        const snapButton = await driver.findElement('#connectUpdate');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectUpdate');
        await driver.clickElement('#connectUpdate');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for confirm button
        await driver.waitForSelector({ text: 'Confirm' });

        // Wait for the permissions content to be rendered
        await driver.waitForSelector({
          text: 'Bitcoin Legacy',
          tag: 'span',
        });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm button
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.delay(500);
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // navigate to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectUpdate',
          text: 'Reconnect to Update Snap',
        });

        // find and scroll to the update new button
        const snapButton2 = await driver.findElement('#connectUpdateNew');
        await driver.scrollToElement(snapButton2);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectUpdateNew');
        await driver.clickElement('#connectUpdateNew');

        // switch to metamask popup and update
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for confirm button
        await driver.waitForSelector({ text: 'Confirm' });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-update-scroll"]');

        // click confirm
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // navigate to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // look for the correct version text
        await driver.waitForSelector({
          css: '#updateSnapVersion',
          text: '"0.35.2-flask.1"',
        });

        // check that snap updated event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Update Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/bip32-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Updated');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/bip32-example-snap',
          new_version: '0.35.2-flask.1',
          old_version: '0.35.0-flask.1',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('test snap update rejected metric', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedSnapUpdateStarted(mockServer),
        await mockedSnapUpdateRejected(mockServer),
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
        ignoredConsoleErrors: [
          'MetaMask - RPC Error: User rejected the request.',
        ],
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the update snap
        const snapButton = await driver.findElement('#connectUpdate');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectUpdate');
        await driver.clickElement('#connectUpdate');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for confirm button
        await driver.waitForSelector({ text: 'Confirm' });

        // Wait for the permissions content to be rendered
        await driver.waitForSelector({
          text: 'Bitcoin Legacy',
          tag: 'span',
        });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.delay(500);
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // navigate to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectUpdate',
          text: 'Reconnect to Update Snap',
        });

        // find and scroll to the update snap
        const snapButton2 = await driver.findElement('#connectUpdateNew');
        await driver.scrollToElement(snapButton2);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect new
        await driver.waitForSelector('#connectUpdateNew');
        await driver.clickElement('#connectUpdateNew');

        // switch to metamask popup and update
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for confirm button
        await driver.waitForSelector({ text: 'Confirm' });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-update-scroll"]');

        // click cancel and wait for window to close
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Cancel',
          tag: 'button',
        });

        // It is necessary to use switchToWindowIfKnown because there is an alert open.
        // Trying to use switchToWindowWithTitle (the new Socket version) or even
        // closeAlertPopup will cause an error.
        await driver.switchToWindowIfKnown(WINDOW_TITLES.TestSnaps);

        // check that snap updated event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Update Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/bip32-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Update Rejected');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/bip32-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('test snap update failed metric', async function () {
    async function mockSegment(mockServer) {
      return [
        await mockedSnapUpdateStarted(mockServer),
        await mockedSnapUpdateFailed(mockServer),
        await mockedNpmUpdate(mockServer),
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
        ignoredConsoleErrors: [
          'MetaMask - RPC Error: Failed to fetch snap "npm:@metamask/bip32-example-snap": Failed to fetch tarball for package "@metamask/bip32-example-snap"..',
          'Failed to fetch snap "npm:@metamask/bip32-example-…ball for package "@metamask/bip32-example-snap"..',
        ],
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        // open a new tab and navigate to test snaps page and connect
        await driver.driver.get(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // find and scroll to the update snap
        const snapButton = await driver.findElement('#connectUpdate');
        await driver.scrollToElement(snapButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#connectUpdate');
        await driver.clickElement('#connectUpdate');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait for confirm button
        await driver.waitForSelector({ text: 'Confirm' });

        // Wait for the permissions content to be rendered
        await driver.waitForSelector({
          text: 'Bitcoin Legacy',
          tag: 'span',
        });

        // click and dismiss possible scroll element
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // click confirm
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.delay(500);
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click ok and wait for window to close
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElementAndWaitForWindowToClose({
          text: 'OK',
          tag: 'button',
        });

        // navigate to test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#connectUpdate',
          text: 'Reconnect to Update Snap',
        });

        // find and scroll to the update snap
        const snapButton2 = await driver.findElement('#connectUpdateNew');
        await driver.scrollToElement(snapButton2);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click update new
        await driver.waitForSelector('#connectUpdateNew');
        await driver.clickElement('#connectUpdateNew');

        // wait for and close alert window
        await driver.delay(1000);
        await driver.closeAlertPopup();

        // switch to metamask popup and update
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for failure message
        await driver.waitForSelector({ text: 'Update failed' });

        // check that snap updated event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Update Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/bip32-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Update Failed');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/bip32-example-snap',
          origin: 'https://metamask.github.io',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
