import { Driver } from '../webdriver/driver';
import { TestSnaps } from '../page-objects/pages/test-snaps';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
import SnapInstallWarning from '../page-objects/pages/dialog/snap-install-warning';
import FixtureBuilderV2 from '../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures } from '../helpers';
import {
  mockBip32Snap,
  mockBip44Snap,
} from '../mock-response-data/snaps/snap-binary-mocks';
import { DAPP_PATH, WINDOW_TITLES } from '../constants';

async function mockSnapBinaries(mockServer: {
  forGet: (url: string) => unknown;
}) {
  return [await mockBip32Snap(mockServer), await mockBip44Snap(mockServer)];
}

describe('Test Snap Multi Install', function () {
  it('test multi install snaps', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        failOnConsoleError: false,
        fixtures: new FixtureBuilderV2()
          .withSnapsPrivacyWarningAlreadyShown()
          .build(),
        testSpecificMock: mockSnapBinaries,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const testSnaps = new TestSnaps(driver);
        await testSnaps.openPage();
        await testSnaps.checkPageIsLoaded();
        await testSnaps.scrollToButton('multiInstallConnectButton');
        await driver.delayFirefox(1000);
        await testSnaps.clickButton('multiInstallConnectButton');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const snapInstall = new SnapInstall(driver);
        const snapInstallWarning = new SnapInstallWarning(driver);
        await snapInstall.checkPageIsLoaded();
        await snapInstall.clickConnectButton();
        await driver.waitForSelector({ tag: 'h3', text: 'Add to MetaMask' });
        await driver.clickElementSafe(
          '[data-testid="snap-install-scroll"]',
          3000,
        );
        await driver.waitForSelector({ text: 'Confirm' });
        await snapInstall.clickConfirmButton();
        await driver.waitForSelector('.mm-checkbox__input');
        await snapInstallWarning.clickCheckboxPermission();
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({ text: 'OK', tag: 'button' });
        await driver.clickElementSafe(
          '[data-testid="snap-install-scroll"]',
          3000,
        );
        await driver.waitForSelector({ text: 'Confirm' });
        await snapInstall.clickConfirmButton();
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');
        await driver.waitForSelector('.mm-checkbox__input');
        await snapInstallWarning.clickCheckboxPermission();
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({ text: 'OK', tag: 'button' });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);
        await testSnaps.checkInstalledSnapsResult(
          'npm:@metamask/bip32-example-snap, npm:@metamask/bip44-example-snap',
        );
      },
    );
  });
});
