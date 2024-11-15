import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import HomePage from '../../page-objects/pages/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import AssetListPage from '../../page-objects/pages/asset-list';

describe('Multichain Asset List', function (this: Suite) {
  it('persists the preferred asset list preference when changing networks', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);

        const accountListPage = new AssetListPage(driver);

        // Ensure starts as "All networks"
        assert.equal(
          await accountListPage.getNetworksFilterLabel(),
          'all networks',
        );

        // Switch to "Current Network"
        await accountListPage.openNetworksFilter();
        await accountListPage.selectNetworkFilterCurrentNetwork();
        assert.equal(
          await accountListPage.getNetworksFilterLabel(),
          'localhost 8545',
        );

        // Switch to second network
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName('Ethereum Mainnet');

        // TODO: Replace this with polling for text to say "Ethereum Mainnet"
        await driver.delay(2000);

        // Ensure that preference stays the same
        assert.equal(
          await accountListPage.getNetworksFilterLabel(),
          'ethereum mainnet',
        );
      },
    );
  });

  it('changes the number of assets display when toggle changes', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);

        const accountListPage = new AssetListPage(driver);

        // TODO: I feel like we shouldn't have to do this; for some reason,
        // initializing with All accounts on the test's default network doesn't show
        // all assets (?)
        // Switch to second network
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName('Ethereum Mainnet');

        const initialNumberOfAssets = await accountListPage.getNumberOfAssets();
        assert.equal(initialNumberOfAssets, 1);

        await accountListPage.openNetworksFilter();
        await accountListPage.selectNetworkFilterAllNetworks();

        // Get the total number of assets for all networks
        const totalNumberOfAssets = await accountListPage.getNumberOfAssets();

        // Ensure more assets are shown with "All Networks" selected
        assert.equal(totalNumberOfAssets, 2);
      },
    );
  });

  it('allows clicking into the asset details page of native token on another network', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const accountListPage = new AssetListPage(driver);

        // TODO: I feel like we shouldn't have to do this; for some reason,
        // initializing with All accounts on the test's default network doesn't show
        // all assets (?)
        // Switch to second network
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName('Ethereum Mainnet');

        // Switch to All Networks
        await accountListPage.openNetworksFilter();
        await accountListPage.selectNetworkFilterAllNetworks();

        // Click on the native token for Localhost 8545
        // TODO: Move this to class
        await driver.clickElement('.multichain-token-list-item');

        // BUG: TEST WILL FAIL HERE; presently, clicking on native token doesn't do anything

        // TODO: Do some type of check that the assets page loaded properly
        // Maybe check for the chart or same balance as the item itself?
      },
    );
  });

  it('switches networks when clicking on send for a token on another network', async function () {
    // TODO: Need a test fixture that has multiple tokens on different networks
    // Ends with ensuring the global network picker says the destination network
    // and the toast is displaying with correct text
  });

  it('switches networks when clicking on swap for a token on another network', async function () {
    // TODO: Need a test fixture that has multiple tokens on different networks
    // This test should more/less be the same as the previous
  });

  it('only shows tokens from the current network in send flow when "All Networks" is selected', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        const homepage = new HomePage(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const accountListPage = new AssetListPage(driver);
        const sendPage = new SendTokenPage(driver);

        // TODO: I feel like we shouldn't have to do this; for some reason,
        // initializing with All accounts on the test's default network doesn't show
        // all assets (?)
        // Switch to second network
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName('Ethereum Mainnet');

        // Switch to All Networks
        await accountListPage.openNetworksFilter();
        await accountListPage.selectNetworkFilterAllNetworks();

        // Veryify there are multiple assets
        const totalNumberOfAssets = await accountListPage.getNumberOfAssets();
        assert.equal(totalNumberOfAssets, 2);

        // Click send button and choose recipient
        await homepage.startSendFlow();
        sendPage.fillRecipient('0x2f318C334780961FB129D2a6c30D0763d9a5C970');

        // Open asset picker to confirm only one asset is shown
        await sendPage.click_assetPickerButton();

        // TODO: Check that there are no known assets from other networks here
      },
    );
  });
});
