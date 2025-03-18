/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
import { MockttpServer } from 'mockttp';
import { WINDOW_TITLES } from '../../../helpers';
import { Driver } from '../../../webdriver/driver';
import { scrollAndConfirmAndAssertConfirm } from '../helpers';
import {
  openDAppWithContract,
  TestSuiteArguments,
  toggleAdvancedDetails,
} from './shared';
import { openTestSnapClickButtonAndInstall } from '../../../page-objects/flows/install-test-snap.flow';
import SnapInstall from '../../../page-objects/pages/dialog/snap-install';

const {
  defaultGanacheOptionsForType2Transactions,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');

describe('Confirmation Redesign ERC721 Approve Component', function () {
  const smartContract = SMART_CONTRACTS.NFTS;

  describe('Submit an Approve transaction', function () {
    it('Sends a type 0 transaction (Legacy)', async function () {
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

          // Navigate to test snaps page and click to the transaction-insights snap
          await openTestSnapClickButtonAndInstall(
            driver,
            'connectTransactionInsightButton',
          );

          await createMintTransaction(driver);
          await confirmMintTransaction(driver);

          await createApproveTransaction(driver);

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
          localNodeOptions: defaultGanacheOptionsForType2Transactions,
          smartContract,
          testSpecificMock: mocks,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }: TestSuiteArguments) => {
          await openDAppWithContract(driver, contractRegistry, smartContract);

          // Navigate to test snaps page and click to the transaction-insights snap
          await openTestSnapClickButtonAndInstall(
            driver,
            'connectTransactionInsightButton',
          );

          await createMintTransaction(driver);

          await confirmMintTransaction(driver);

          await createApproveTransaction(driver);
          await assertApproveDetails(driver);
          await confirmApproveTransaction(driver);
        },
      );
    });
  });
});

async function mocked4Bytes(mockServer: MockttpServer) {
  return await mockServer
    .forGet('https://www.4byte.directory/api/v1/signatures/')
    .withQuery({ hex_signature: '0x095ea7b3' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 149,
            created_at: '2016-07-09T03:58:29.617584Z',
            text_signature: 'approve(address,uint256)',
            hex_signature: '0x095ea7b3',
            bytes_signature: '\t^§³',
          },
        ],
      },
    }));
}

async function mocks(server: MockttpServer) {
  return [await mocked4Bytes(server)];
}

async function createMintTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#mintButton');
}

export async function confirmMintTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });

  await scrollAndConfirmAndAssertConfirm(driver);

  // Verify Mint Transaction is Confirmed before proceeding
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement('[data-testid="account-overview__activity-tab"]');
  await driver.waitForSelector('.transaction-status-label--confirmed');
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
}

async function createApproveTransaction(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement('#approveButton');
}

async function assertApproveDetails(driver: Driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Withdrawal request',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'This site wants permission to withdraw your NFTs',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Estimated changes',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Withdraw',
  });

  await driver.waitForSelector({
    css: 'p',
    text: '#1',
  });

  await toggleAdvancedDetails(driver);

  await driver.waitForSelector({
    css: 'p',
    text: 'Spender',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Request from',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Interacting with',
  });

  await driver.waitForSelector({
    css: 'p',
    text: 'Method',
  });
  const snapInstall = new SnapInstall(driver);
  await snapInstall.check_transactionInsightsTitle();
  await snapInstall.check_transactionInsights();
  await snapInstall.check_transactionFromAddress();
  await snapInstall.check_transactionToAddress();
}

async function confirmApproveTransaction(driver: Driver) {
  await scrollAndConfirmAndAssertConfirm(driver);
  await driver.waitUntilXWindowHandles(3);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await driver.clickElement({ text: 'Activity', tag: 'button' });
  await driver.waitForSelector(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );
}
