import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { unlockWallet, withFixtures } from '../../helpers';
import { DAPP_URL, WINDOW_TITLES } from '../../constants';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';

describe('Deprecated networks', function (this: Suite) {
  it('User should not find goerli network when clicking on the network selector', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        // Navigate to extension home screen
        await unlockWallet(driver);
        // Open the first dapp which starts on chain '0x539
        await driver.openNewPage(DAPP_URL);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.openNewPage(
          `${driver.extensionUrl}/popup.html?activeTabOrigin=${DAPP_URL}`,
        );

        // Resize the popup window after it's opened
        await driver.driver
          .manage()
          .window()
          .setRect({ width: 400, height: 600 });

        await driver.clickElement('.multichain-connected-site-menu ');
        await driver.clickElement({
          text: 'Localhost 8545',
          tag: 'button',
        });

        const selectNetworkDialog = new SelectNetwork(driver);
        await selectNetworkDialog.checkPageIsLoaded();
        await selectNetworkDialog.checkNetworkOptionIsDisplayed(
          'Goerli',
          false,
        );
      },
    );
  });
});
