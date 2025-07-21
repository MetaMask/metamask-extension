import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/add-network-confirmations';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';

describe('Switch ethereum chain', function (this: Suite) {
  it('should successfully change the network in response to wallet_switchEthereumChain', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port: 8546,
              chainId: 1338,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        await testDapp.clickAddNetworkButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addNetworkConfirmation = new AddNetworkConfirmation(driver);
        await addNetworkConfirmation.check_pageIsLoaded('Localhost 8546');
        await addNetworkConfirmation.approveAddNetwork();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const assetList = new AssetListPage(driver);
        await assetList.check_networkFilterText('Localhost 8546');
      },
    );
  });
});
