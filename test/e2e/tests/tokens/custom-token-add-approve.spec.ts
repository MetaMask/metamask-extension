import {
  withFixtures,
  defaultGanacheOptions,
  openDapp,
  WINDOW_TITLES,
  tempToggleSettingRedesignedTransactionConfirmations,
  logInWithBalanceValidation,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HomePage from '../../page-objects/pages/home/homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import ApproveTokensModal from '../../page-objects/pages/dialog/approve-tokens';

describe('Create token, approve token and approve token without gas', function () {
  const smartContract = SMART_CONTRACTS.HST;
  const symbol = 'TST';
  const symbolWithValue = (value: string) => `${value} ${symbol}`;

  it('imports and renders the balance for the new token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        const homePage = new HomePage(driver);
        const assetListPage = new AssetListPage(driver);

        // imports custom token from extension
        await homePage.check_pageIsLoaded();
        await homePage.goToTokensTab();
        await assetListPage.importCustomToken(contractAddress, symbol);

        // renders balance for newly created token
        await assetListPage.check_tokenExistsInList(symbol, '10');
      },
    );
  });

  it('approves an already created token and displays the token approval data @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        const testDapp = new TestDapp(driver);
        const approveTokensModal = new ApproveTokensModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const homePage = new HomePage(driver);

        // create token
        await openDapp(driver, contractAddress);
        await testDapp.check_pageIsLoaded();
        await testDapp.clickApproveTokens();

        // approve token from dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await approveTokensModal.check_page1IsLoaded(symbol);
        await approveTokensModal.clickVerifyThirdPartyLink();
        await approveTokensModal.check_thirdPartyModalIsOpened();
        await approveTokensModal.clickThirdPartyGotItButton();

        // back to approval modal
        // Validate elements on approve token popup
        await approveTokensModal.check_approvalDetails(
          `0x095ea7b30000000000000000000000009bc5baf874d2da8d216ae9f137804184ee5afef4`,
        );
        await approveTokensModal.clickNext();

        // Spending cap modal is opened
        await approveTokensModal.check_page2IsLoaded(symbolWithValue('7'));
        await approveTokensModal.clickApprove();

        // Moved to expanded window to validate the txn
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(1);
        await activityListPage.check_txAction(`Approve ${symbol} spending cap`);
      },
    );
  });

  it('set custom spending cap, customizes gas, edit spending cap and checks transaction in transaction list @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        const testDapp = new TestDapp(driver);
        const approveTokensModal = new ApproveTokensModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const homePage = new HomePage(driver);

        // create token
        await openDapp(driver, contractAddress);
        await testDapp.check_pageIsLoaded();
        await testDapp.clickApproveTokens();

        // approve token from dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await approveTokensModal.check_page1IsLoaded(symbol);

        // set custom spending cap
        await approveTokensModal.setCustomSpendingCapValue('5');
        await approveTokensModal.clickNext();
        await approveTokensModal.check_page2IsLoaded(symbolWithValue('5'));

        // edit gas fee
        await approveTokensModal.editGasFee('60001', '10');

        // edit spending cap (goes back to page 1)
        await approveTokensModal.editSpendingCap('9');
        await approveTokensModal.clickNext();

        // validate the spending cap has been updated
        await approveTokensModal.check_page2IsLoaded(symbolWithValue('9'));

        // submits the transaction
        await approveTokensModal.clickApprove();

        // Moved to expanded window to validate the txn
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(1);
        await activityListPage.check_txAction(`Approve ${symbol} spending cap`);
      },
    );
  });

  it('set maximum spending cap, submits the transaction and finds the transaction in the transactions list @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        const testDapp = new TestDapp(driver);
        const approveTokensModal = new ApproveTokensModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const homePage = new HomePage(driver);

        // create token
        await openDapp(driver, contractAddress);
        await testDapp.check_pageIsLoaded();
        await testDapp.clickApproveTokens();

        // approve token from dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await approveTokensModal.check_page1IsLoaded(symbol);

        // set max spending cap
        await approveTokensModal.clickMaxSpendingCapButton();
        await approveTokensModal.clickNext();
        await approveTokensModal.check_page2IsLoaded(symbolWithValue('10')); // expect the spending cap to be the same as the balance
        await approveTokensModal.clickApprove();

        // Moved to expanded window to validate the txn
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(1);
        await activityListPage.check_txAction(`Approve ${symbol} spending cap`);
      },
    );
  });

  it('approves token without gas, set site suggested spending cap, submits the transaction and finds the transaction in the transactions list @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, ganacheServer }) => {
        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await logInWithBalanceValidation(driver, ganacheServer);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        const testDapp = new TestDapp(driver);
        const approveTokensModal = new ApproveTokensModal(driver);
        const activityListPage = new ActivityListPage(driver);
        const homePage = new HomePage(driver);

        // create token
        await openDapp(driver, contractAddress);
        await testDapp.check_pageIsLoaded();
        await testDapp.clickApproveTokensWithoutGas();

        // approve token from dapp
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await approveTokensModal.check_page1IsLoaded(symbol);

        // set max spending cap
        await approveTokensModal.setCustomSpendingCapValue('5');
        await approveTokensModal.clickNext();
        await approveTokensModal.check_page2IsLoaded(symbolWithValue('5')); // expect the spending cap to be the same as the balance
        await approveTokensModal.clickApprove();

        // Moved to expanded window to validate the txn
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        await homePage.goToActivityList();
        await activityListPage.check_confirmedTxNumberDisplayedInActivity(1);
        await activityListPage.check_txAction(`Approve ${symbol} spending cap`);
      },
    );
  });
});
