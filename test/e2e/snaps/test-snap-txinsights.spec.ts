import { Driver } from '../webdriver/driver';
import SnapInstall from '../page-objects/pages/dialog/snap-install';
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

describe('Test Snap TxInsights', function () {
  it(' validate the insights section appears for ERC20 transaction', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const testDapp = new TestDapp(driver);
        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page and click to the transaction-insights test snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        // open the test-dapp page
        await openDapp(driver);
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        // click send tx
        await testDapp.clickMaliciousERC20TransferButton();

        // Switch back to MetaMask dialog and validate the transaction insights title and type
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_transactionInsightsTitle();
        await snapInstall.check_transactionInsightsType('ERC-20');
      },
    );
  });

  it(' validate the insights for ERC721 transactions', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);

        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(SMART_CONTRACTS.NFTS);

        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page and click to the transaction-insights snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
        await testDapp.clickERC721TransferFromButton();
        await driver.delay(veryLargeDelayMs); // this is needed for the transaction to be processed in firefox browser
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_transactionInsightsTitle();
        await snapInstall.check_transactionAddress('0x5CfE7...6a7e1');
        await snapInstall.check_transactionAddress('0x581c3...45947');
        await snapInstall.check_transactionInsightsType('ERC-721');
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
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }: TestSuiteArguments) => {
        await loginWithoutBalanceValidation(driver);
        const testDapp = new TestDapp(driver);

        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(SMART_CONTRACTS.NFTS);

        const snapInstall = new SnapInstall(driver);

        // Navigate to test snaps page and click to the transaction-insights snap
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectTransactionInsightButton',
        );

        await testDapp.openTestDappPage({ contractAddress, url: DAPP_URL });
        await testDapp.clickERC1155SetApprovalForAllButton();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await snapInstall.check_transactionInsightsTitle();
        // await snapInstall.check_transactionInsightsType('ERC-1155');
        await snapInstall.check_transactionAddress('0x5CfE7...6a7e1');
        await snapInstall.check_transactionAddress('0x581c3...45947');
      },
    );
  });
});
