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

describe('Trezor Hardware', function (this: Suite) {
  it('can create an ERC20 token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTrezorAccount()
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
        await testDappPage.checkPageIsLoaded();
        await testDappPage.clickERC20CreateTokenButton();
        // Confirm token creation
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const createContractModal = new CreateContractModal(driver);
        await createContractModal.checkPageIsLoaded();
        await createContractModal.clickConfirm();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.checkTokenAddressesValue(
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
        await homePage.checkExpectedTokenBalanceIsDisplayed('10', symbol);

        // Transfer token
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.clickERC20TokenTransferButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const tokenTransferTransactionConfirmation =
          new TokenTransferTransactionConfirmation(driver);
        await tokenTransferTransactionConfirmation.checkPageIsLoaded();
        await tokenTransferTransactionConfirmation.clickConfirmButton();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const activityListPage = new ActivityListPage(driver);
        await homePage.goToActivityList();
        await activityListPage.checkTxAction(`Sent ${symbol}`);
        await activityListPage.checkTxAmountInActivity(`-1.5 ${symbol}`);

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
        await activityListPage.checkTransactionActivityByText(
          `Approve ${symbol} spending cap`,
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');

        // Increase token allowance
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDappPage.clickERC20IncreaseAllowanceButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await txConfirmation.clickFooterConfirmButtonAndAndWaitForWindowToClose();
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await homePage.goToActivityList();
        await activityListPage.checkTransactionActivityByText(
          `Increase ${symbol} spending cap`,
        );
        await activityListPage.checkWaitForTransactionStatus('confirmed');
      },
    );
  });
});
