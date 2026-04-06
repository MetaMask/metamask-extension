import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import HomePage from '../../page-objects/pages/home/homepage';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import TransactionDetailsPage from '../../page-objects/pages/home/transaction-details';
import NetworkManager from '../../page-objects/pages/network-manager';
import {
  mockTronApis,
  tronTrc20TransferDetailsFixture,
  tronNativeTransferDetailsFixture,
} from './mocks/common-tron';

describe('Tron transaction activity list', function (this: Suite) {
  it('user can see activity list with Tron transactions', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
        await nonEvmHomePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        // The mock returns 3 native TRX + 10 TRC20 = 13 transactions total
        // The first in the merged list is the most recent TRC20 transfer (HTX)
        await activityList.checkTxAction({ action: 'Sent' });
        await activityList.checkTxAmountInActivity(
          tronTrc20TransferDetailsFixture.amount,
          1,
        );
        await activityList.checkNoFailedTransactions();
      },
    );
  });

  it('user can see TRC20 transfer transaction details', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
        await nonEvmHomePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        await activityList.clickOnActivity(1);

        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.checkTransactionStatus(
          tronTrc20TransferDetailsFixture.status,
        );
        await transactionDetails.checkTransactionAmount(
          tronTrc20TransferDetailsFixture.amount,
        );
        await transactionDetails.checkTransactionViewDetailsLink();
        // Verify the transaction hash link points to the Tron block explorer
        await transactionDetails.checkTronTransactionHashLink(
          tronTrc20TransferDetailsFixture.txHash,
        );
      },
    );
  });

  it('user can see native TRX transfer transactions in activity list', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
        await nonEvmHomePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        // The 3rd native TRX tx (TransferContract) sends 2,000,000 SUN = 2 TRX
        // Verify it appears in the combined activity list
        await activityList.checkTransactionAmount('-2 TRX');

        // Find the -2 TRX transaction by iterating amounts and click on it
        const amounts = await activityList.getAllTransactionAmounts();
        const nativeTxIndex = amounts.findIndex((a) => a === '-2 TRX') + 1;

        await activityList.clickOnActivity(nativeTxIndex);

        const transactionDetails = new TransactionDetailsPage(driver);
        await transactionDetails.checkTransactionStatus(
          tronNativeTransferDetailsFixture.status,
        );
        await transactionDetails.checkTransactionViewDetailsLink();
        await transactionDetails.checkTronTransactionHashLink(
          tronNativeTransferDetailsFixture.txHash,
        );
      },
    );
  });

  it('user can see TRC20 approval transaction in activity list', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.waitForNonEvmAccountsLoaded();

        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomePage = new NonEvmHomepage(driver);
        await nonEvmHomePage.checkPageIsLoaded({ amount: '6.072 TRX' });
        await nonEvmHomePage.goToActivityList();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        // The approval transaction (USDT approval, 4th TRC20 tx) shows as "Approve"
        await activityList.checkTransactionActivityByText('Approve');
      },
    );
  });
});
