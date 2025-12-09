/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES, withFixtures } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import TestDapp from '../../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import ERC20ApproveTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/erc20-approve-transaction-confirmation';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import HomePage from '../../../page-objects/pages/home/homepage';
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

          await importTST(driver);

          await createERC20ApproveTransaction(driver);

          await assertApproveDetails(driver);

          await confirmApproveTransaction(driver);
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

          await importTST(driver);

          await createERC20ApproveTransaction(driver);

          await assertApproveDetails(driver);

          await confirmApproveTransaction(driver);
        },
      );
    });
  });
});

async function mocks(server: MockttpServer) {
  return [await mocked4BytesApprove(server)];
}

async function importTST(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  const assetListPage = new AssetListPage(driver);
  await assetListPage.importCustomTokenByChain(
    '0x539',
    '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
  );
}

async function createERC20ApproveTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#approveTokens');
}

async function assertApproveDetails(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  const erc20ApproveConfirmation = new ERC20ApproveTransactionConfirmation(
    driver,
  );

  await erc20ApproveConfirmation.checkSpendingCapRequestTitle();
  await erc20ApproveConfirmation.checkSpendingCapPermissionDescription();
  await erc20ApproveConfirmation.checkEstimatedChangesSection();
  await erc20ApproveConfirmation.checkSpendingCapSection();
  await erc20ApproveConfirmation.checkSpendingCapAmount('7');

  await erc20ApproveConfirmation.clickAdvancedDetailsButton();

  await erc20ApproveConfirmation.checkAdvancedDetailsSections();
  await erc20ApproveConfirmation.checkSpendingCapSection();
}

async function confirmApproveTransaction(driver: Driver) {
  await scrollAndConfirmAndAssertConfirm(driver);

  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  const homePage = new HomePage(driver);
  await homePage.goToActivityList();
  await driver.waitForSelector(
    '.transaction-status-label--confirmed:nth-of-type(1)',
  );
}
