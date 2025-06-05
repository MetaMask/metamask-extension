import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import {
  DAPP_URL,
  withFixtures,
  WINDOW_TITLES,
  openDapp,
  veryLargeDelayMs,
} from '../helpers';
import TestDapp from '../page-objects/pages/test-dapp';
import { SMART_CONTRACTS } from '../seeder/smart-contracts';
import ContractAddressRegistry from '../seeder/contract-address-registry';
import { TestSuiteArguments } from '../tests/confirmations/transactions/shared';
import TransactionConfirmation from '../page-objects/pages/confirmations/redesign/transaction-confirmation';
import SnapTxInsights from '../page-objects/pages/dialog/snap-txinsight';
import { mockInsightsSnap } from '../mock-response-data/snaps/snap-binary-mocks';

describe('Test Snap TxInsights', function () {
  it('shows insight for ERC20 transactions', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        testSpecificMock: mockInsightsSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        const snapTxInsights = new SnapTxInsights(driver);

        // Navigate to test snaps page and click to the transaction-insights test snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        // open the test-dapp page
        await openDapp(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickMaliciousERC20TransferButton();

        // Switch back to MetaMask dialog and validate the transaction insights title and type
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapTxInsights.check_transactionInsightsTitle();
        await snapTxInsights.check_transactionInsightsType('ERC-20');
      },
    );
  });

  it('shows insights for ERC721 transactions', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        testSpecificMock: mockInsightsSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        const snapTxInsights = new SnapTxInsights(driver);
        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(SMART_CONTRACTS.NFTS);

        // Navigate to test snaps page and click to the transaction-insights snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
        await testDapp.clickERC721MintButton();
        await driver.delay(veryLargeDelayMs);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const mintConfirmation = new TransactionConfirmation(driver);
        await mintConfirmation.clickFooterConfirmButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.clickERC721TransferFromButton();
        await driver.delay(veryLargeDelayMs); // this is needed for the transaction to be processed

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapTxInsights.check_transactionInsightsTitle();
        await snapTxInsights.check_transactionAddress('0x5CfE7...6a7e1');
        await snapTxInsights.check_transactionAddress('0x581c3...45947');
        await snapTxInsights.check_transactionInsightsType('ERC-721');
      },
    );
  });

  it('shows insights for ERC1155 transactions', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        testSpecificMock: mockInsightsSnap,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        const snapTxInsights = new SnapTxInsights(driver);
        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(SMART_CONTRACTS.NFTS);

        // Navigate to test snaps page and click to the transaction-insights snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
        await testDapp.clickERC1155SetApprovalForAllButton();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapTxInsights.check_transactionInsightsTitle();
        await snapTxInsights.check_transactionAddress('0x5CfE7...6a7e1');
        await snapTxInsights.check_transactionAddress('0x581c3...45947');
      },
    );
  });
});
