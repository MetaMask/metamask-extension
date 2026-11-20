import { Driver } from '../../../webdriver/driver';
import {
  closeActivityTransactionDetails,
  openActivityTransactionDetails,
} from '../../../page-objects/flows/activity.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import { withStellarFixtures } from '../../stellar/fixtures/with-stellar-fixtures';
import { DEFAULT_STELLAR_ADDRESS } from '../../../constants';
import { STELLAR_NETWORK_NAME } from '../../stellar/mocks/stellar-constants';
import {
  STELLAR_RECIPIENT_ADDRESS,
  xlmSendTx,
} from '../../stellar/mocks/stellar-tx-fixtures';

const BASE_TIMESTAMP = Date.now();

describe('Stellar - Activity status', function () {
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
            address: DEFAULT_STELLAR_ADDRESS,
            horizonTransactions: [failedSend],
          },
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await switchToNetworkFromNetworkSelect(driver, STELLAR_NETWORK_NAME);

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
        await closeActivityTransactionDetails({ driver, activityTab });
      },
    );
  });
});
