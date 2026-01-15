import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { Driver } from '../../webdriver/driver';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import NetworkManager from '../../page-objects/pages/network-manager';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import {
  mockTronApis,
  TRON_RECIPIENT_ADDRESS,
} from '../tron/mocks/common-tron';

describe('Send Tron', function () {
  it('it should be possible to send TRX', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
        manifestFlags: {
          remoteFeatureFlags: {
            tronAccounts: { enabled: true, minimumVersion: '13.6.0' },
            sendRedesign: { enabled: true },
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);

        // Switch to Tron network
        const networkManager = new NetworkManager(driver);
        await networkManager.openNetworkManager();
        await networkManager.selectTab('Popular');
        await networkManager.selectNetworkByNameWithWait('Tron');

        const nonEvmHomepage = new NonEvmHomepage(driver);
        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await nonEvmHomepage.clickOnSendButton();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');

        // Wait for the send page to load
        await sendPage.fillRecipient(TRON_RECIPIENT_ADDRESS);
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();
        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAmountInActivity('-50,000 HTX', 1); // mocked activity
        await activityList.checkNoFailedTransactions();
      },
    );
  });
});
