/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import ERC20ApproveTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/erc20-approve-transaction-confirmation';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import HomePage from '../../../page-objects/pages/home/homepage';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import { mocked4BytesApprove, TestSuiteArguments } from './shared';

const FixtureBuilder = require('../../../fixtures/fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Approve Component', function () {
  const smartContract = SMART_CONTRACTS.HST;

  describe('Submit an Approve transaction', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          localNodeOptions: {
            hardfork: 'muirGlacier',
          },
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);
          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          // Import TST token
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const assetListPage = new AssetListPage(driver);
          await assetListPage.importCustomTokenByChain(
            '0x539',
            '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
          );

          // Create ERC20 approve transaction
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.clickApproveTokens();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const erc20ApproveConfirmation =
            new ERC20ApproveTransactionConfirmation(driver);

          await erc20ApproveConfirmation.checkSpendingCapRequestTitle();
          await erc20ApproveConfirmation.checkSpendingCapPermissionDescription();
          await erc20ApproveConfirmation.checkEstimatedChangesSection();
          await erc20ApproveConfirmation.checkSpendingCapSection();
          await erc20ApproveConfirmation.checkSpendingCapAmount('7');

          await erc20ApproveConfirmation.clickAdvancedDetailsButton();

          await erc20ApproveConfirmation.checkAdvancedDetailsSections();
          await erc20ApproveConfirmation.checkSpendingCapSection();

          // Confirm approve transaction
          await scrollAndConfirmAndAssertConfirm(driver);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({
          driver,
          contractRegistry,
          localNodes,
        }: TestSuiteArguments) => {
          const contractAddress =
            await contractRegistry?.getContractAddress(smartContract);

          await loginWithBalanceValidation(driver, localNodes?.[0]);
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage({ contractAddress });
          await testDapp.checkPageIsLoaded();

          // Import TST token
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );
          const assetListPage = new AssetListPage(driver);
          await assetListPage.importCustomTokenByChain(
            '0x539',
            '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
          );

          // Create ERC20 approve transaction
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          await testDapp.clickApproveTokens();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          const erc20ApproveConfirmation =
            new ERC20ApproveTransactionConfirmation(driver);

          await erc20ApproveConfirmation.checkSpendingCapRequestTitle();
          await erc20ApproveConfirmation.checkSpendingCapPermissionDescription();
          await erc20ApproveConfirmation.checkEstimatedChangesSection();
          await erc20ApproveConfirmation.checkSpendingCapSection();
          await erc20ApproveConfirmation.checkSpendingCapAmount('7');

          await erc20ApproveConfirmation.clickAdvancedDetailsButton();

          await erc20ApproveConfirmation.checkAdvancedDetailsSections();
          await erc20ApproveConfirmation.checkSpendingCapSection();

          // Confirm approve transaction
          await scrollAndConfirmAndAssertConfirm(driver);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          const homePage = new HomePage(driver);
          await homePage.goToActivityList();
          const activityList = new ActivityListPage(driver);
          await activityList.checkConfirmedTxNumberDisplayedInActivity(1);
        },
      );
    });
  });
});

async function mocks(server: MockttpServer) {
  return [await mocked4BytesApprove(server)];
}
