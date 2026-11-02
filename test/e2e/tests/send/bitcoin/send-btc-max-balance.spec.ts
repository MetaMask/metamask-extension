import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import { DEFAULT_BTC_BALANCE } from '../../../constants';
import { TxToastNotification } from '../../../page-objects/components/tx-toast-notification';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import BitcoinReviewTxPage from '../../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../../page-objects/pages/send/send-page';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const TOTAL_BALANCE_SEND_AMOUNT = '0.99999719';

describe('Bitcoin Send', function (this: Suite) {
  this.timeout(300_000);

  it('sends the fee-buffered total BTC balance', async function () {
    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        // This amount reserves the fee for the static fixture's funding input.
        localNode: false,
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
        // Refresh re-hydrates the UI with the asynchronously fetched Snap balance.
        await homePage.refreshPage();
        await new TokensTab(driver).checkExpectedTokenBalanceIsDisplayed(
          `${DEFAULT_BTC_BALANCE}`,
          'BTC',
        );

        await homePage.startSendFlow();
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(
          'bip122:000000000019d6689c085ae165831e93',
          'BTC',
        );
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(TOTAL_BALANCE_SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.clickConfirmButton();

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        await activityTab.checkTransactionActivityByText('Sending');
        await activityTab.checkWaitForTransactionStatus('pending');
      },
    );
  });
});
