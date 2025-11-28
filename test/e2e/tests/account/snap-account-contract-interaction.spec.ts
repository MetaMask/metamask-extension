import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { DAPP_PATH } from '../../constants';
import { Anvil } from '../../seeder/anvil';
import { Ganache } from '../../seeder/ganache';
import ContractAddressRegistry from '../../seeder/contract-address-registry';
import { PRIVATE_KEY_TWO, withFixtures, WINDOW_TITLES } from '../../helpers';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { mockSnapSimpleKeyringAndSite } from './snap-keyring-site-mocks';

describe('Snap Account Contract interaction', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('deposits to piggybank contract', async function () {
    await withFixtures(
      {
        dappOptions: {
          numberOfTestDapps: 1,
          customDappPaths: [DAPP_PATH.SNAP_SIMPLE_KEYRING_SITE],
        },
        fixtures: new FixtureBuilder()
          .withPermissionControllerSnapAccountConnectedToTestDapp()
          .build(),
        localNodeOptions: {
          hardfork: 'london',
        },
        smartContract,
        testSpecificMock: async (mockServer: Mockttp) => {
          const snapMocks = await mockSnapSimpleKeyringAndSite(
            mockServer,
            8081,
          );
          return snapMocks;
        },
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        contractRegistry,
        localNodes,
      }: {
        driver: Driver;
        contractRegistry: ContractAddressRegistry;
        localNodes: Anvil[] | Ganache[] | undefined[];
      }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
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
        await headerNavbar.checkAccountLabel('SSK Account');

        // Open Dapp with contract
        const testDapp = new TestDapp(driver);
        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(smartContract);
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.checkPageIsLoaded();
        await testDapp.createDepositTransaction();

        const transactionConfirmation = new TransactionConfirmation(driver);
        await transactionConfirmation.checkPageIsLoaded();
        await transactionConfirmation.clickFooterConfirmButton();

        // Confirm the transaction in activity list on MetaMask
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity();
        await activityList.checkTxAmountInActivity('-4 ETH');
      },
    );
  });
});
