/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';

import { Driver } from '../../../webdriver/driver';
import ERC20ApproveTransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/erc20-approve-transaction-confirmation';
import { importTestToken } from '../../../page-objects/flows/import-token.flow';
import TestDapp from '../../../page-objects/pages/test-dapp';
import {
  confirmApproveTransaction,
  mocked4BytesApprove,
  openDAppWithContract,
  TestSuiteArguments,
  waitForApproveTransactionWindow,
} from './shared';

const { withFixtures, WINDOW_TITLES } = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC20 Approve Component', function () {
  const smartContract = SMART_CONTRACTS.HST;

  describe('Submit an Approve transaction', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
      await withFixtures(
        {
          dapp: true,
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
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await importTST(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const testDapp = new TestDapp(driver);
          await testDapp.clickApproveTokens();

          await assertApproveDetails(driver);

          await confirmApproveTransaction(driver);
        },
      );
    });

    it('Sends a type 2 transaction (EIP1559)', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          await importTST(driver);

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const testDapp = new TestDapp(driver);
          await testDapp.clickApproveTokens();

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
  // Use the new token import flow
  await importTestToken(
    driver,
    '0x581c3C1A2A4EBDE2A0Df29B5cf4c116E42945947',
    '0x539',
  );
}

async function assertApproveDetails(driver: Driver) {
  // Wait for the approve transaction window and switch to it
  await waitForApproveTransactionWindow(driver);

  // Create the ERC20 approve confirmation page object
  const erc20ApproveConfirmation = new ERC20ApproveTransactionConfirmation(
    driver,
  );

  // Verify the page is loaded
  await erc20ApproveConfirmation.check_pageIsLoaded();

  // Verify all basic approve transaction details
  await erc20ApproveConfirmation.check_approveTransactionDetails();

  // Expand advanced details and verify all sections
  await erc20ApproveConfirmation.expandAndVerifyAdvancedDetails();
}
