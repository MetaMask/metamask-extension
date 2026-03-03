import { WINDOW_TITLES } from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../../helpers';
import { Mockttp } from '../../../mock-e2e';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import Confirmation from '../../../page-objects/pages/confirmations/confirmation';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/transaction-confirmation';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { SMART_CONTRACTS } from '../../../seeder/smart-contracts';
import { mocked4BytesIncreaseAllowance, TestSuiteArguments } from './shared';

describe('Confirmation Redesign ERC20 Increase Allowance', function () {
  describe('Submit an increase allowance transaction', function () {
    it('submits an increase allowance transaction with a small spending cap', async function () {
      await withFixtures(
        generateFixtureOptions(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress = await contractRegistry?.getContractAddress(
            SMART_CONTRACTS.HST,
          );
          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.clickERC20IncreaseAllowanceButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new TransactionConfirmation(driver);
          await txConfirmation.editSpendingCap('3');

          const confirmation = new Confirmation(driver);
          await confirmation.clickScrollToBottomButton();
          await confirmation.clickFooterConfirmButton();

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
        generateFixtureOptions(this),
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress = await contractRegistry?.getContractAddress(
            SMART_CONTRACTS.HST,
          );
          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          await testDapp.clickERC20IncreaseAllowanceButton();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const txConfirmation = new TransactionConfirmation(driver);
          await txConfirmation.editSpendingCap('3000');

          const confirmation = new Confirmation(driver);
          await confirmation.clickScrollToBottomButton();
          await confirmation.clickFooterConfirmButton();

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
});

function generateFixtureOptions(mochaContext: Mocha.Context) {
  return {
    dappOptions: { numberOfTestDapps: 1 },
    fixtures: new FixtureBuilderV2()
      .withPermissionControllerConnectedToTestDapp()
      .build(),
    smartContract: SMART_CONTRACTS.HST,
    testSpecificMock: mocks,
    title: mochaContext.test?.fullTitle(),
  };
}

async function mocks(server: Mockttp) {
  return [await mocked4BytesIncreaseAllowance(server)];
}
