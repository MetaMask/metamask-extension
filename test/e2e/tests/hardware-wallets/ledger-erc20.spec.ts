import { Suite } from 'mocha';
import TestDappPage from '../../page-objects/pages/test-dapp';
import FixtureBuilder from '../../fixture-builder';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import CreateContractModal from '../../page-objects/pages/dialog/create-contract';
import WatchAssetConfirmation from '../../page-objects/pages/confirmations/legacy/watch-asset-confirmation';
import HomePage from '../../page-objects/pages/home/homepage';
import TokenTransferTransactionConfirmation from '../../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';

describe('Ledger Hardware', function (this: Suite) {
  it('can create an ERC20 token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withLedgerAccount()
          .withPermissionControllerConnectedToTestDapp({
            account: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          })
          .build(),
        title: this.test?.fullTitle(),
        dapp: true,
      },
      async ({ driver, localNodes }) => {
        const symbol = 'TST';
        (await localNodes?.[0]?.setAccountBalance(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          '0x100000000000000000000',
        )) ?? console.error('localNodes is undefined or empty');
        await loginWithBalanceValidation(
          driver,
          undefined,
          undefined,
          '1208925.8196',
        );
        const testDappPage = new TestDappPage(driver);
        await testDappPage.openTestDappPage();
        await testDappPage.check_pageIsLoaded();
        await testDappPage.clickERC20CreateTokenButton();
        // Confirm token creation
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const createContractModal = new CreateContractModal(driver);
        await createContractModal.check_pageIsLoaded();
        await createContractModal.clickConfirm();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.check_TokenAddressesValue(
          '0xcB17707e0623251182A654BEdaE16429C78A7424',
        );
        // Add to wallet
        await testDappPage.clickERC20WatchAssetButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const watchAssetConfirmation = new WatchAssetConfirmation(driver);
        await watchAssetConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToTokensTab();
        await homePage.check_expectedTokenBalanceIsDisplayed('10', symbol);

        // Transfer token
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.clickERC20TokenTransferButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const tokenTransferTransactionConfirmation =
          new TokenTransferTransactionConfirmation(driver);
        await tokenTransferTransactionConfirmation.check_pageIsLoaded();
        await tokenTransferTransactionConfirmation.clickConfirmButton();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const activityListPage = new ActivityListPage(driver);
        await homePage.goToActivityList();
        await activityListPage.check_txAction(`Sent ${symbol}`);
        await activityListPage.check_txAmountInActivity(`-1.5 ${symbol}`);

        // Approve token
        const txConfirmation = new TransactionConfirmation(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.clickApproveTokens();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await txConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.goToActivityList();
        await activityListPage.check_transactionActivityByText(
          `Approve ${symbol} spending cap`,
        );
        await activityListPage.check_waitForTransactionStatus('confirmed');

        // Increase token allowance
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.clickERC20IncreaseAllowanceButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await txConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.goToActivityList();
        await activityListPage.check_transactionActivityByText(
          `Increase ${symbol} spending cap`,
        );
        await activityListPage.check_waitForTransactionStatus('confirmed');
      },
    );
  });
});
