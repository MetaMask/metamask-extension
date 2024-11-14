import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../seeder/ganache';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import HomePage from '../../page-objects/pages/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/asset-list';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';

export const NATIVE_TOKEN_SYMBOL = 'ETH';

describe('Multichain Aggregated Balances', function (this: Suite) {
  it('shows correct aggregated balance when "Current Network" is selected', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withTokenBalances()
          .withTokensControllerERC20()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract: SMART_CONTRACTS.HST,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer?: Ganache;
      }) => {
        const expectedBalance = '$10,000.00';
        await loginWithBalanceValidation(driver, ganacheServer);

        const homepage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const settingsPage = new SettingsPage(driver);
        const accountListPage = new AccountListPage(driver);
        const assetListPage = new AssetListPage(driver);

        // Switch to Mainnet
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName('Ethereum Mainnet');

        // Need to turn on setting to show fiat balances
        await headerNavbar.openSettingsPage();
        await settingsPage.toggleBalanceSetting();
        await settingsPage.exitSettings();

        // Check 1: The homepage main balance
        await homepage.check_expectedBalanceIsDisplayed(expectedBalance);

        // Check 2: Open the network filter, check balance for "Current Network"
        await assetListPage.openNetworksFilter();
        const networkFilterTotal =
          await assetListPage.getCurrentNetworksOptionTotal();
        assert.equal(networkFilterTotal, expectedBalance); // TODO: Move to AssetListPage method

        // Check 3: Open Account menu, check balance
        // TODO: Should the AccountMenu be effected by the network filter?
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountBalanceDisplayed(expectedBalance);
        await accountListPage.closeAccountModal();

        // Check 4: Open send flow and check balance of account
        // TODO: Should the AccountMenu be effected by the network filter?
        await homepage.startSendFlow();
        // TODO: Ensure account balance is correct, assuming sending to self
      },
    );
  });

  it('shows correct aggregated balance when "All Networks" is selected', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Same as test above but with All Networks selected
      },
    );
  });

  it('does not include testnet balances in aggregated balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        // Start test by going to Settings -> Advanced and turning on "Show conversion on test networks"
        // Then select "All Networks", switch to Ethereum Mainnet, ensure the testnet balance isn't included
      },
    );
  });
});
