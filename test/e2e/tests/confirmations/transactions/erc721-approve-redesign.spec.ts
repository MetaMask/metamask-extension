import { WINDOW_TITLES } from '../../../constants';
import { withFixtures } from '../../../helpers';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { login } from '../../../page-objects/flows/login.flow';
import ERC20ApproveTransactionConfirmation from '../../../page-objects/pages/confirmations/erc20-approve-transaction-confirmation';
import PermitConfirmation from '../../../page-objects/pages/confirmations/permit-confirmation';
import SetApprovalForAllTransactionConfirmation from '../../../page-objects/pages/confirmations/set-approval-for-all-transaction-confirmation';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import HomePage from '../../../page-objects/pages/home/homepage';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import { mocked4BytesApprove, TestSuiteArguments } from './shared';

describe('Confirmation Redesign ERC721 Approve Component', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('Submit an Approve transaction', function () {
    it('submits an ERC721 approve transaction', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilderV2()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          testSpecificMock: mocked4BytesApprove,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await login(driver, { localNode: localNodes?.[0] });
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          const transactionConfirmation = new TransactionConfirmation(driver);
          const erc20ApproveConfirmation =
            new ERC20ApproveTransactionConfirmation(driver);
          const permitConfirmation = new PermitConfirmation(driver);
          const setApprovalForAllConfirmation =
            new SetApprovalForAllTransactionConfirmation(driver);
          const homePage = new HomePage(driver);
          const activityTab = new ActivityTab(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.clickERC721MintButton();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await transactionConfirmation.checkPageIsLoaded();
          await scrollAndConfirmAndAssertConfirm(driver);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await homePage.goToActivityList();
          await activityTab.checkConfirmedTxNumberDisplayedInActivity(1);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await testDapp.clickERC721ApproveButton();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await permitConfirmation.checkTitle('Withdrawal request');
          await setApprovalForAllConfirmation.checkSetApprovalForAllSubHeading();
          await erc20ApproveConfirmation.checkEstimatedChangesSection();
          await erc20ApproveConfirmation.checkWithdrawSection();
          await erc20ApproveConfirmation.checkNftTokenValue('#1');
          await erc20ApproveConfirmation.clickAdvancedDetailsButton();
          await erc20ApproveConfirmation.checkAdvancedDetailsSections();

          await scrollAndConfirmAndAssertConfirm(driver);
          await driver.waitUntilXWindowHandles(2);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          await homePage.goToActivityList();
          await activityTab.checkConfirmedTxNumberDisplayedInActivity(2);
        },
      );
    });
  });
});
