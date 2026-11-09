import { Suite } from 'mocha';
import { Driver } from '../../../webdriver/driver';
import { openActivityTransactionDetails } from '../../../page-objects/flows/activity.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../../page-objects/flows/stellar-network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { STELLAR_ACCOUNT_ADDRESS } from '../../stellar/mocks/common-stellar';
import {
  STELLAR_RECIPIENT_ADDRESS,
  xlmSendTx,
} from '../../stellar/mocks/stellar-tx-fixtures';

const BASE_TIMESTAMP = Date.now();

/**
 * Closes transaction details without relying on history.back() clearing `/tx/`
 * (Stellar CAIP chain ids in the hash make that wait flaky). Re-open Activity.
 *
 * @param driver - WebDriver instance.
 * @param activityTab - Activity tab page object.
 */
async function closeDetailsAndReturnToActivity(
  driver: Driver,
  activityTab: ActivityTab,
): Promise<void> {
  await driver.clickElementSafe(
    { testId: 'transaction-details-back-button' },
    1_000,
  );
  await driver.clickElement({ testId: 'bottom-nav-activity' });
  await activityTab.checkPageIsLoaded();
}

describe('Stellar - Activity status', function (this: Suite) {
  this.timeout(180_000);

  it('shows a failed XLM send with Failed status in the list and details', async function () {
    // Horizon maps successful → Confirmed / Failed only. Pending (Unconfirmed)
    // is snap-local and belongs in the Send flow, not a storage-seed + reload.
    const failedSend = xlmSendTx({
      amount: '3',
      destination: STELLAR_RECIPIENT_ADDRESS,
      status: 'failed',
      timestamp: BASE_TIMESTAMP - 60_000,
    });

    await withStellarFixtures(
      {
        accounts: [
          {
            address: STELLAR_ACCOUNT_ADDRESS,
            horizonTransactions: [failedSend],
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          validateBalance: false,
          waitForNonEvmAccounts: false,
        });
        await selectStellarNetwork(driver);

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkPageIsLoaded();

        await activityTab.checkTransactionActivityByText('Send failed');
        await activityTab.checkTransactionAmount('-3 XLM');

        const failedDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Send failed',
        });
        await failedDetails.checkTitle('Send failed');
        await failedDetails.checkStatus('Failed');
        await failedDetails.checkAmount('-3 XLM');
        await failedDetails.checkHashLinkPresent();
        await failedDetails.checkViewDetailsLink();
        await closeDetailsAndReturnToActivity(driver, activityTab);
      },
    );
  });
});
