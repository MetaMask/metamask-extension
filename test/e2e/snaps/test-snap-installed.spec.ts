/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockedEndpoint, Mockttp } from 'mockttp';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { completeSnapInstallSwitchToTestSnap } from '../page-objects/flows/snap-permission.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import {
  mockDialogSnap,
  mockErrorSnap,
} from '../mock-response-data/snaps/snap-binary-mocks';

const { strict: assert } = require('assert');
const { withFixtures, getEventPayloads } = require('../helpers');

type TestSuiteArguments = {
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

describe('Test Snap installed', function () {
  it('metrics are sent correctly and error snap validation', async function () {
    async function mockSegmentAndSnaps(mockServer: Mockttp) {
      return [
        await mockedSnapInstall(mockServer),
        await mockErrorSnap(mockServer),
        await mockDialogSnap(mockServer),
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegmentAndSnaps,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: TestSuiteArguments) => {
        await loginWithoutBalanceValidation(driver);

        // Open a new tab and navigate to test snaps page and click dialog snap
        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectDialogsButton');

        // Check installation success
        await testSnaps.check_installationComplete(
          'connectDialogsButton',
          'Reconnect to Dialogs Snap',
        );

        // Check that snap installed event metrics have been sent
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.deepStrictEqual(events[0].event, 'Snap Installed');
        assert.deepStrictEqual(events[0].properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: 'npm:@metamask/dialog-example-snap',
          origin: 'https://metamask.github.io',
          version: '2.3.1',
          category: 'Snaps',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'background',
        });

        // Click to connect to errors snap and validate the install snaps result
        await testSnaps.scrollAndClickButton('connectErrorsButton');
        await completeSnapInstallSwitchToTestSnap(driver);
        await testSnaps.check_installedSnapsResult(
          'npm:@metamask/dialog-example-snap, npm:@metamask/error-example-snap',
        );

        // Click Send error button and validate the message result
        await testSnaps.scrollAndClickButton('sendErrorButton');
        await testSnaps.check_messageResultSpan(
          'errorResultSpan',
          '"Hello, world!"',
        );
      },
    );
  });
});
