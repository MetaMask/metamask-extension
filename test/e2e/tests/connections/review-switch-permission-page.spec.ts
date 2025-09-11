import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import ReviewPermissionsConfirmation from '../../page-objects/pages/confirmations/redesign/review-permissions-confirmation';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';

describe('Permissions Page when Dapp Switch to an enabled and non permissioned network', function () {
  it('should switch to the chain when dapp tries to switch network to an enabled network after showing updated permissions page', async function () {
    const port: number = 8546;
    const chainId: number = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleNode()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        localNodeOptions: [
          {
            type: 'anvil',
          },
          {
            type: 'anvil',
            options: {
              port,
              chainId,
            },
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        // Open Dapp One and check the chainId
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        const chainIdRequest: string = JSON.stringify({
          method: 'eth_chainId',
        });
        const chainIdBeforeConnect: string = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );
        assert.equal(chainIdBeforeConnect, '0x539'); // 1337
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        // Switch to ethereum network and check the chainId on testdapp
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromSendFlow(driver, 'Ethereum');
        await homePage.checkLocalNodeBalanceIsDisplayed();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        const chainIdBeforeConnectAfterManualSwitch: string =
          await driver.executeScript(
            `return window.ethereum.request(${chainIdRequest})`,
          );
        assert.equal(chainIdBeforeConnectAfterManualSwitch, '0x1');

        // Connect to dapp and check the chainId is still the same as the wallet
        await testDapp.connectAccount({
          publicAddress: DEFAULT_FIXTURE_ACCOUNT,
          chainId: '0x1',
        });
        const chainIdAfterConnect: string = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );
        assert.equal(chainIdAfterConnect, '0x1');

        // Switch to new chainId and check the connected chainId on testdapp
        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x539' }],
        });
        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const reviewPermissionsConfirmation = new ReviewPermissionsConfirmation(
          driver,
        );
        await reviewPermissionsConfirmation.checkPageIsLoaded();
        await reviewPermissionsConfirmation.confirmReviewPermissions();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        const chainIdAfterSwitch: string = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );
        assert.equal(chainIdAfterSwitch, '0x539'); // 1337

        // Switch to the extension, change network and check the chainId on testdapp
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromSendFlow(driver, 'Localhost 8546');

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();
        const chainIdAfterManualSwitch: string = await driver.executeScript(
          `return window.ethereum.request(${chainIdRequest})`,
        );
        assert.equal(chainIdAfterManualSwitch, '0x539');
      },
    );
  });
});
