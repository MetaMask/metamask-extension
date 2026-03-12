import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
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

const EMPTY_PAGE_BODY_SELECTOR = {
  testId: 'empty-page-body',
  text: 'Empty page by MetaMask',
};

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
        const snapInstall = new SnapInstall(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectDialogsButton');
        await testSnaps.checkInstallationComplete(
          'connectDialogsButton',
          'Reconnect to Dialogs Snap',
        );

        await testSnaps.clickButton('confirmationButton');
        await driver.delay(500);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.delay(500);
        await snapInstall.waitForConfirmationDialogLinkText();
        await snapInstall.clickConfirmationDialogLinkText();
        await snapInstall.waitForVisitSiteLinkContent();
        await snapInstall.clickVisitSiteLink();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestE2EPage);
        await driver.waitForSelector(EMPTY_PAGE_BODY_SELECTOR);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.waitForDialogApproveButton();
        await snapInstall.clickDialogApproveButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkMessageResultSpan('dialogResultSpan', 'true');
      },
    );
  });
});
