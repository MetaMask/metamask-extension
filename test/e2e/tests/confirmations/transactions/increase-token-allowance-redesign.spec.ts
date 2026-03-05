import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import ERC20ApproveTransactionConfirmation from '../../../page-objects/pages/confirmations/erc20-approve-transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { mocked4BytesIncreaseAllowance, TestSuiteArguments } from './shared';

describe('Confirmation Redesign ERC20 Increase Allowance', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('submits an increase allowance transaction with a small spending cap', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        testSpecificMock: mocks,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, localNodes }: TestSuiteArguments) => {
        const contractAddress =
          await contractRegistry?.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes?.[0]);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.checkPageIsLoaded();

        await testDapp.clickERC20IncreaseAllowanceButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const txConfirmation = new ERC20ApproveTransactionConfirmation(driver);
        await txConfirmation.editSpendingCap('3');

        await txConfirmation.clickScrollToBottomButton();
        await txConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.clickConfirmedTransaction();
        await activityList.checkSpendingCapValueInDetails('3 TST');
      },
    );
  });

  it('submits an increase allowance transaction with a large spending cap', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        testSpecificMock: mocks,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry, localNodes }: TestSuiteArguments) => {
        const contractAddress =
          await contractRegistry?.getContractAddress(smartContract);
        await loginWithBalanceValidation(driver, localNodes?.[0]);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.checkPageIsLoaded();

        await testDapp.clickERC20IncreaseAllowanceButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const txConfirmation = new ERC20ApproveTransactionConfirmation(driver);
        await txConfirmation.editSpendingCap('3000');

        await txConfirmation.clickScrollToBottomButton();
        await txConfirmation.clickFooterConfirmButton();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        await activityList.clickConfirmedTransaction();
        await activityList.checkSpendingCapValueInDetails('3000 TST');
      },
    );
  });
});

async function mocks(server: MockttpServer) {
  return [await mocked4BytesIncreaseAllowance(server)];
}
