import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../seeder/ganache';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import {
  multipleGanacheOptionsForType2Transactions,
  PRIVATE_KEY_TWO,
  withFixtures,
  WINDOW_TITLES,
} from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Snap Account Contract interaction @no-mmi', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('deposits to piggybank contract', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerSnapAccountConnectedToTestDapp()
          .build(),
        ganacheOptions: multipleGanacheOptionsForType2Transactions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        contractRegistry,
        ganacheServer,
      }: {
        driver: Driver;
        contractRegistry: ContractAddressRegistry;
        ganacheServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, ganacheServer);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // Import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(
          PRIVATE_KEY_TWO,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // Open Dapp with contract
        const testDapp = new TestDapp(driver);
        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(smartContract);
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.check_pageIsLoaded();
        await testDapp.createDepositTransaction();

        // Confirm the transaction in activity list on MetaMask
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity('-4 ETH');
      },
    );
  });
});
