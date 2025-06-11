import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SelectNetwork from '../../page-objects/pages/dialog/select-network';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';
import ContractAddressRegistry from '../../seeder/contract-address-registry';

const EXPECTED_BALANCE_USD = '$42,500.00';
const EXPECTED_SEPOLIA_BALANCE_NATIVE = '25';
const NETWORK_NAME_MAINNET = 'Ethereum Mainnet';
const NETWORK_NAME_SEPOLIA = 'Sepolia';
const SEPOLIA_NATIVE_TOKEN = 'SepoliaETH';

describe('Multichain Aggregated Balances', function (this: Suite) {
  it('shows correct aggregated balance when "Current Network" is selected', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
        contractRegistry,
      }: {
        driver: Driver;
        localNodes: Anvil[] | Ganache[] | undefined[];
        contractRegistry: ContractAddressRegistry;
      }) => {
        const contract = contractRegistry.getContractAddress(smartContract);
        console.log("// Step 1: Log in and set up page objects");
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homepage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const selectNetworkDialog = new SelectNetwork(driver);
        const settingsPage = new SettingsPage(driver);
        const accountListPage = new AccountListPage(driver);
        const assetListPage = new AssetListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        console.log('Step 2: Switch to Ethereum Mainnet');
        await headerNavbar.clickSwitchNetworkDropDown();
        await selectNetworkDialog.selectNetworkName(NETWORK_NAME_MAINNET);

        console.log('Step 3: Enable fiat balance display in settings');
        await headerNavbar.openSettingsPage();
        await settingsPage.toggleBalanceSetting();
        await settingsPage.exitSettings();

        console.log('Step 4: Verify main balance on homepage and account menu');
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_BALANCE_USD,
          'usd',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountValueAndSuffixDisplayed(
          EXPECTED_BALANCE_USD,
        );
        await accountListPage.closeAccountModal();

        console.log('Step 5: Verify balance in send flow');
        await homepage.startSendFlow();
        await sendTokenPage.checkAccountValueAndSuffix(
          EXPECTED_BALANCE_USD,
        );
        await sendTokenPage.clickCancelButton();

        console.log('Step 6: Check balance for "Current Network" in network filter');
        await assetListPage.openNetworksFilter();
        const networkFilterTotal =
          await assetListPage.getCurrentNetworksOptionTotal();
        assert.equal(networkFilterTotal, EXPECTED_BALANCE_USD);
        await assetListPage.clickCurrentNetworkOption();

        console.log('Step 7: Verify balance after selecting "Current Network"');
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_BALANCE_USD,
          'usd',
        );
        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountValueAndSuffixDisplayed(
          EXPECTED_BALANCE_USD,
        );
        await accountListPage.closeAccountModal();

        console.log('Step 8: Verify balance in send flow after selecting "Current Network"');
        await homepage.startSendFlow();
        await sendTokenPage.checkAccountValueAndSuffix(
          EXPECTED_BALANCE_USD,
        );
        await sendTokenPage.clickCancelButton();

        console.log('Step 9: Switch to Sepolia test network');
        await headerNavbar.clickSwitchNetworkDropDown();
        await driver.clickElement('.toggle-button');
        await driver.clickElement({ text: NETWORK_NAME_SEPOLIA, tag: 'p' });

        console.log('Step 10: Verify native balance on Sepolia network');
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_SEPOLIA_BALANCE_NATIVE,
          SEPOLIA_NATIVE_TOKEN,
        );
        await assetListPage.check_networkFilterText(NETWORK_NAME_SEPOLIA);

        console.log('Step 11: Enable fiat display on testnets in settings');
        await headerNavbar.openSettingsPage();
        await settingsPage.clickAdvancedTab();
        await settingsPage.toggleShowFiatOnTestnets();
        await settingsPage.closeSettingsPage();

        console.log('Step 12: Verify USD balance on Sepolia network');
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_BALANCE_USD,
          'usd',
        );
      },
    );
  });
});
