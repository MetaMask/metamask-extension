import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures, defaultGanacheOptions } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../seeder/ganache';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import HomePage from '../../page-objects/pages/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/asset-list';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';

const EXPECTED_MAINNET_BALANCE_USD = '$84,985.04';
const EXPECTED_CURRENT_NETWORK_BALANCE_USD = '$42,492.52';
const EXPECTED_SEPOLIA_BALANCE_NATIVE = '24.9956';
const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
const NETWORK_NAME_SEPOLIA = 'Sepolia';
const SEPOLIA_NATIVE_TOKEN = 'SepoliaETH';

describe('Multichain Aggregated Balances', function (this: Suite) {
  if (!process.env.PORTFOLIO_VIEW) {
    return;
  }

  it('shows correct aggregated balance when "Current Network" is selected', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
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
        // Step 1: Log in and set up page objects
        await loginWithBalanceValidation(driver, ganacheServer);

        const homepage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const settingsPage = new SettingsPage(driver);
        const accountListPage = new AccountListPage(driver);
        const assetListPage = new AssetListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        // Step 2: Switch to Ethereum Mainnet
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);

        // Step 3: Enable fiat balance display in settings
        await headerNavbar.openSettingsPage();
        await settingsPage.toggleBalanceSetting();
        await settingsPage.exitSettings();

        // Step 4: Verify main balance on homepage and account menu
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_MAINNET_BALANCE_USD,
          'usd',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountValueAndSuffixDisplayed(
          EXPECTED_MAINNET_BALANCE_USD,
        );
        await accountListPage.closeAccountModal();

        // Step 5: Verify balance in send flow
        await homepage.closePopover();
        await homepage.startSendFlow();
        await sendTokenPage.checkAccountValueAndSuffix(
          EXPECTED_MAINNET_BALANCE_USD,
        );
        await sendTokenPage.clickCancelButton();

        // Step 6: Check balance for "Current Network" in network filter
        await assetListPage.openNetworksFilter();
        const networkFilterTotal =
          await assetListPage.getCurrentNetworksOptionTotal();
        assert.equal(networkFilterTotal, EXPECTED_CURRENT_NETWORK_BALANCE_USD);
        await assetListPage.clickCurrentNetworkOption();

        // Step 7: Verify balance after selecting "Current Network"
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_CURRENT_NETWORK_BALANCE_USD,
          'usd',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountValueAndSuffixDisplayed(
          EXPECTED_CURRENT_NETWORK_BALANCE_USD,
        );
        await accountListPage.closeAccountModal();

        // Step 8: Verify balance in send flow after selecting "Current Network"
        await homepage.startSendFlow();
        await sendTokenPage.checkAccountValueAndSuffix(
          EXPECTED_CURRENT_NETWORK_BALANCE_USD,
        );
        await sendTokenPage.clickCancelButton();

        // Step 9: Switch to Sepolia test network
        await headerNavbar.clickSwitchNetworkDropDown();
        await driver.clickElement('.toggle-button');
        await driver.clickElement({ text: NETWORK_NAME_SEPOLIA, tag: 'p' });

        // Step 10: Verify native balance on Sepolia network
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_SEPOLIA_BALANCE_NATIVE,
          SEPOLIA_NATIVE_TOKEN,
        );
        await assetListPage.checkNetworkFilterText(NETWORK_NAME_SEPOLIA);

        // Step 11: Enable fiat display on testnets in settings
        await headerNavbar.openSettingsPage();
        await settingsPage.clickAdvancedTab();
        await settingsPage.toggleShowFiatOnTestnets();
        await settingsPage.closeSettingsPage();

        // Step 12: Verify USD balance on Sepolia network
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_CURRENT_NETWORK_BALANCE_USD,
          'usd',
        );
      },
    );
  });
});
