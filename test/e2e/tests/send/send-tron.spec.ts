import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import ActivityTab from '../../page-objects/pages/home/activity-tab';
import {
  mockTronApis,
  TRON_RECIPIENT_ADDRESS,
} from '../tron/mocks/common-tron';
import FixtureBuilderV2 from 'test/e2e/fixtures/fixture-builder-v2';

describe('Send Tron', function () {
  it('it should be possible to send TRX', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockTronApis,
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // Switch to Tron via the UI. Enabling it through fixtures causes a redirect
        // back to the default network because the snap is not yet initialized
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Tron');

        const homePage = new HomePage(driver);
        const tokensTab = new TokensTab(driver);
        await tokensTab.checkExpectedTokenBalanceIsDisplayed('6.072', 'TRX');
        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );
        await homePage.clickOnSendButton();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken('tron:728126428', 'TRX');

        // Wait for the send page to load
        await sendPage.fillRecipient({
          recipientAddress: TRON_RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount('1');
        await sendPage.pressContinueButton();
        await snapTransactionConfirmation.checkPageIsLoaded();
        await snapTransactionConfirmation.clickFooterConfirmButton();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTxAmountInActivity('-50,000 HTX', 1); // mocked activity
        await activityTab.checkNoFailedTransactions();
      },
    );
  });
});
