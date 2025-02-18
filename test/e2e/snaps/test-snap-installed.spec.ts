/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockedEndpoint, Mockttp } from 'mockttp';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';

const { strict: assert } = require('assert');
const { withFixtures, getEventPayloads, WINDOW_TITLES } = require('../helpers');

export type TestSuiteArguments = {
  driver: Driver;
  mockedEndpoint?: MockedEndpoint | MockedEndpoint[];
};

/**
 * Mocks the segment API multiple times for specific payloads that we expect to
 * see when these tests are run. In this case, we are looking for
 * Snap Metrics. Do not use the constants from the metrics constants files,
 * because if these change we want a strong indicator to our data team that the
 * shape of data will change.
 *
 * @param mockServer
 * @returns
 */
async function mockedSnapInstall(mockServer: Mockttp) {
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

describe('Test Snap Metrics', function () {
  it('tests snap install metric', async function () {
    async function mockSegment(mockServer: Mockttp) {
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await loginWithoutBalanceValidation(driver);

        // Open a new tab and navigate to test snaps page and connect
        const testSnaps = new TestSnaps(driver);
        const snapInstall = new SnapInstall(driver);
        await testSnaps.openPage();

        // Find and scroll to the dialog snap
        await testSnaps.clickConnectDialogsSnapButton();

        // Switch to MetaMask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await testSnaps.completeSnapInstallConfirmation();

        // Wait for npm installation success
        await testSnaps.check_installationComplete(
          testSnaps.connectDialogsButton,
          'Reconnect to Dialogs Snap',
        );

        // Check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Installed');
        assert.deepStrictEqual(events[0].properties, {
          snap_id: 'npm:@metamask/dialog-example-snap',
          origin: 'https://metamask.github.io',
          version: '2.3.1',
          category: 'Snaps',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'background',
        });

        // Click send inputs on test snap page
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Click to connect to errors snap
        await testSnaps.clickConnectErrors();

        // Switch to MetaMask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await testSnaps.completeSnapInstallConfirmation();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // Validate the install snaps result
        await snapInstall.check_installedSnapsResult();
      },
    );
  });
});
