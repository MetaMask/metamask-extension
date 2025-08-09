import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { regularDelayMs, WINDOW_TITLES, withFixtures } from '../../helpers';
import AddNetworkConfirmation from '../../page-objects/pages/confirmations/redesign/add-network-confirmations';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import { getPermittedChains } from './common';

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

  it('should only show additional network requested when multiple network permissions already exist', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPopularNetworks()
          .withPermissionControllerConnectedToTestDappWithChains([
            '0x1', // Hex Chain ID for Ethereum Mainnet
            '0x89', // Hex Chain ID for Polygon
          ])
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2105' }], // Hex Chain ID for Base Mainnet
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.findVisibleElement({
          text: 'Base Mainnet',
          tag: 'p',
        });

        await driver.assertElementNotPresent({
          text: 'Ethereum Mainnet',
          tag: 'p',
        });

        await driver.assertElementNotPresent({
          text: 'Polygon',
          tag: 'p',
        });
      },
    );
  });

  it('should incrementally add new requested network to existing permissions without overriding them', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp() // Connected to Localhost
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        const switchEthereumChainRequest = JSON.stringify({
          jsonrpc: '2.0',
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }], // Hex Chain ID for Ethereum Mainnet
        });

        await driver.executeScript(
          `window.ethereum.request(${switchEthereumChainRequest})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.delay(regularDelayMs);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const afterPermittedChains = await getPermittedChains(driver);

        assert.deepEqual(afterPermittedChains, ['0x539', '0x1']); // Hex Chain IDs for Localhost and Ethereum Mainnet
      },
    );
  });
});
