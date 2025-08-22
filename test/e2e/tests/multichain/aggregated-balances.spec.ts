import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import AccountListPage from '../../page-objects/pages/account-list-page';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';
import { switchToNetworkFromSendFlow } from '../../page-objects/flows/network.flow';
import { CHAIN_IDS } from '../../../../shared/constants/network';

const EXPECTED_BALANCE_USD = '$85,025.00';
const EXPECTED_SEPOLIA_BALANCE_NATIVE = '25';
const NETWORK_NAME_MAINNET = 'Ethereum';
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
          .withPreferencesController({
            preferences: { showTestNetworks: true },
          })
          .withEnabledNetworks({
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          })
          .build(),
        localNodeOptions: {
          hardfork: 'muirGlacier',
        },
        smartContract,
        ethConversionInUsd: 3401, // 25 ETH × $3401 = $85,025.00
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodes,
      }: {
        driver: Driver;
        localNodes: Anvil[] | Ganache[] | undefined[];
      }) => {
        console.log('// Step 1: Log in and set up page objects');
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homepage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const settingsPage = new SettingsPage(driver);
        const accountListPage = new AccountListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);

        console.log('Step 2: Switch to Ethereum Mainnet');
        await switchToNetworkFromSendFlow(driver, NETWORK_NAME_MAINNET);

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
        await sendTokenPage.checkAccountValueAndSuffix(EXPECTED_BALANCE_USD);
        await sendTokenPage.clickCancelButton();

        await headerNavbar.openAccountMenu();
        await accountListPage.check_accountValueAndSuffixDisplayed(
          EXPECTED_BALANCE_USD,
        );
        await accountListPage.closeAccountModal();

        console.log(
          'Step 6: Verify balance in send flow after selecting "Current Network"',
        );
        await homepage.startSendFlow();
        await sendTokenPage.checkAccountValueAndSuffix(EXPECTED_BALANCE_USD);
        await sendTokenPage.clickCancelButton();

        console.log('Step 7: Switch to Sepolia test network');
        await switchToNetworkFromSendFlow(driver, NETWORK_NAME_SEPOLIA);

        console.log('Step 8: Verify native balance on Sepolia network');
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_SEPOLIA_BALANCE_NATIVE,
          SEPOLIA_NATIVE_TOKEN,
        );

        console.log('Step 9: Enable fiat display on testnets in settings');
        await headerNavbar.openSettingsPage();
        await settingsPage.clickAdvancedTab();
        await settingsPage.toggleShowFiatOnTestnets();
        await settingsPage.closeSettingsPage();

        console.log('Step 10: Verify USD balance on Sepolia network');
        await homepage.check_expectedBalanceIsDisplayed(
          EXPECTED_SEPOLIA_BALANCE_NATIVE,
          SEPOLIA_NATIVE_TOKEN,
        );
      },
    );
  });
});
