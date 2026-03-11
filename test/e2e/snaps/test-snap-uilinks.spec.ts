import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { withFixtures } from '../helpers';
import { mockDialogSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import { emptyHtmlPage } from '../mock-e2e';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

async function mockSnapsWebsite(
  mockServer: Parameters<typeof mockDialogSnap>[0],
) {
  return await (
    mockServer as {
      forGet: (u: string) => {
        thenCallback: (
          cb: () => { statusCode: number; body: string },
        ) => unknown;
      };
    }
  )
    .forGet('https://snaps.metamask.io/')
    .thenCallback(() => ({
      statusCode: 200,
      body: emptyHtmlPage(),
    }));
}

async function mockSnapBinaryAndWebsite(
  mockServer: Parameters<typeof mockDialogSnap>[0],
) {
  return [await mockDialogSnap(mockServer), await mockSnapsWebsite(mockServer)];
}

describe('Test Snap UI Links', function () {
  it('test link in confirmation snap_dialog type', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        failOnConsoleError: false,
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockSnapBinaryAndWebsite,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectDialogsButton');
        await testSnaps.checkInstallationComplete(
          'connectDialogsButton',
          'Reconnect to Dialogs Snap',
        );

        await testSnaps.clickButton('confirmationButton');
        await driver.delay(500);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.delay(500);
        await driver.waitForSelector({ text: 'That', tag: 'span' });
        await driver.clickElement({ text: 'That', tag: 'span' });
        await driver.waitForSelector({ text: 'snaps.metamask.io', tag: 'b' });
        await driver.waitForSelector({ text: 'Visit site', tag: 'a' });
        await driver.clickElement({ text: 'Visit site', tag: 'a' });

        await driver.switchToWindowWithTitle('E2E Test Page');
        await driver.waitForSelector({
          testId: 'empty-page-body',
          text: 'Empty page by MetaMask',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({ text: 'Approve', tag: 'button' });
        await driver.clickElement({ text: 'Approve', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'true');
      },
    );
  });
});
