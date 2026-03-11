import { strict as assert } from 'assert';
import type { Mockttp } from 'mockttp';
import { Driver } from '../webdriver/driver';
import { getEventPayloads, withFixtures } from '../helpers';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import {
  MOCK_META_METRICS_ID,
  DAPP_PATH,
  DAPP_URL,
  WINDOW_TITLES,
} from '../constants';
import {
  mockNotificationSnap,
  mockWebpackPluginOldSnap,
  mockWebpackPluginSnap,
} from '../mock-response-data/snaps/snap-binary-mocks';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import HomePage from '../page-objects/pages/home/homepage';
import SnapListPage from '../page-objects/pages/snap-list-page';

async function mockedSnapInstall(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Installed' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapInstallStarted(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Install Started' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapInstallRejected(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Install Rejected' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapInstallFailed(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Install Failed' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapUninstall(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Uninstalled' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapUpdated(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Updated' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapUpdateStarted(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Update Started' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapUpdateRejected(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Update Rejected' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapUpdateFailed(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Update Failed' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedSnapExportUsed(mockServer: Mockttp) {
  return mockServer
    .forPost('https://api.segment.io/v1/batch')
    .withJsonBodyIncluding({
      batch: [{ type: 'track', event: 'Snap Export Used' }],
    })
    .thenCallback(() => ({ statusCode: 200 }));
}

async function mockedNpmInstall(mockServer: Mockttp) {
  return mockServer.forGet(/https:\/\/registry\.npmjs\.org/u).thenCallback(() => ({
    statusCode: 429,
  }));
}

async function mockedNpmUpdate(mockServer: Mockttp) {
  return mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => ({ statusCode: 429 }));
}

const NOTIFICATIONS_SNAP_NAME = 'Notifications Example Snap';

describe('Test Snap Metrics', function () {
  it('tests snap install metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapInstallStarted(mockServer),
        await mockedSnapInstall(mockServer),
        await mockedSnapExportUsed(mockServer),
        await mockNotificationSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(DAPP_URL);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNotificationButton',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.clickButton('sendInAppNotificationButton');

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Install Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Installed');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          version: '2.3.0',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[2].event, 'Snap Export Used');
        assert.deepStrictEqual(events[2].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          export: 'onRpcRequest',
          success: true,
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('tests snap install rejected metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapInstallStarted(mockServer),
        await mockedSnapInstallRejected(mockServer),
        await mockNotificationSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage(DAPP_URL);
        await testSnaps.checkPageIsLoaded();
        await testSnaps.scrollAndClickButton('connectNotificationButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const snapInstall = new SnapInstall(driver);
        await snapInstall.checkPageIsLoaded();
        await snapInstall.clickConnectButton();
        await driver.clickElement({
          text: 'Cancel',
          tag: 'button',
        });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Install Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Install Rejected');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('tests snap install failed metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapInstallStarted(mockServer),
        await mockedSnapInstallFailed(mockServer),
        await mockedNpmInstall(mockServer),
        await mockNotificationSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage(DAPP_URL);
        await testSnaps.checkPageIsLoaded();
        await testSnaps.scrollAndClickButton('connectNotificationButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const snapInstall = new SnapInstall(driver);
        await snapInstall.checkPageIsLoaded();
        await snapInstall.clickConnectButton();

        await driver.waitForSelector({ text: 'Connection failed' });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Install Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Install Failed');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/notification-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('tests snap uninstall metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapUninstall(mockServer),
        await mockNotificationSnap(mockServer),
        await mockWebpackPluginSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(DAPP_URL);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNotificationButton',
        );

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.headerNavbar.openSnapListPage();

        const snapListPage = new SnapListPage(driver);
        await snapListPage.openSnapByName(NOTIFICATIONS_SNAP_NAME);
        await snapListPage.removeSnapViaPopover(NOTIFICATIONS_SNAP_NAME);
        await snapListPage.checkNoSnapsInstalledMessage();

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
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapUpdateStarted(mockServer),
        await mockedSnapUpdated(mockServer),
        await mockNotificationSnap(mockServer),
        await mockWebpackPluginSnap(mockServer),
        await mockWebpackPluginOldSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(DAPP_URL);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        await openTestSnapClickButtonAndInstall(driver, 'connectUpdateButton');
        await testSnaps.checkInstallationComplete(
          'connectUpdateButton',
          'Reconnect to Update Snap',
        );

        await testSnaps.scrollAndClickButton('connectUpdateNewButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.checkPageIsLoaded();
        await snapInstall.updateScrollAndClickConfirmButton();
        await snapInstall.clickOkButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('updateVersionSpan', '"2.1.3"');

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Update Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/webpack-plugin-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Updated');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/webpack-plugin-example-snap',
          new_version: '2.1.3',
          old_version: '2.0.0',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('test snap update rejected metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapUpdateStarted(mockServer),
        await mockedSnapUpdateRejected(mockServer),
        await mockNotificationSnap(mockServer),
        await mockWebpackPluginOldSnap(mockServer),
        await mockWebpackPluginSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
        ignoredConsoleErrors: [
          'MetaMask - RPC Error: User rejected the request.',
        ],
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(DAPP_URL);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        await openTestSnapClickButtonAndInstall(driver, 'connectUpdateButton');
        await testSnaps.checkInstallationComplete(
          'connectUpdateButton',
          'Reconnect to Update Snap',
        );

        await testSnaps.scrollAndClickButton('connectUpdateNewButton');
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.checkPageIsLoaded();
        await driver.clickElementSafe('[data-testid="snap-update-scroll"]');
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Cancel',
          tag: 'button',
        });

        await driver.switchToWindowIfKnown(WINDOW_TITLES.TestSnaps);

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Update Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/webpack-plugin-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Update Rejected');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/webpack-plugin-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });

  it('test snap update failed metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
      return [
        await mockedSnapUpdateStarted(mockServer),
        await mockedSnapUpdateFailed(mockServer),
        await mockWebpackPluginOldSnap(mockServer),
        await mockedNpmUpdate(mockServer),
        await mockWebpackPluginSnap(mockServer),
      ];
    }

    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
        ignoredConsoleErrors: [
          'MetaMask - RPC Error: Failed to fetch snap "npm:@metamask/webpack-plugin-example-snap": Failed to fetch tarball for package "@metamask/webpack-plugin-example-snap".',
          'Failed to fetch snap "npm:@metamask/webpack-plugin… package "@metamask/webpack-plugin-example-snap".',
        ],
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: unknown;
      }) => {
        await loginWithBalanceValidation(driver);

        await driver.openNewPage(DAPP_URL);

        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);

        await openTestSnapClickButtonAndInstall(driver, 'connectUpdateButton');
        await testSnaps.checkInstallationComplete(
          'connectUpdateButton',
          'Reconnect to Update Snap',
        );

        await testSnaps.scrollAndClickButton('connectUpdateNewButton');
        await driver.delay(1000);
        await driver.closeAlertPopup();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({ text: 'Update failed' });

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Update Started');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/webpack-plugin-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
        assert.deepStrictEqual(events[1].event, 'Snap Update Failed');
        assert.deepStrictEqual(events[1].properties, {
          snap_id: 'npm:@metamask/webpack-plugin-example-snap',
          origin: 'http://127.0.0.1:8080',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });
      },
    );
  });
});
