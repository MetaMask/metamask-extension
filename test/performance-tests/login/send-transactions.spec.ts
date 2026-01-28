import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import SendPage from '../../e2e/page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../e2e/page-objects/pages/confirmations/snap-transaction-confirmation';
import NonEvmHomepage from '../../e2e/page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from '../../e2e/tests/solana/common-solana';

const RECIPIENT_ADDRESS = 'GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna';

describe('Send Transactions Performance', function () {
  setupPerformanceReporting();

  it('measures send flow performance for native SOL', async function () {
    this.timeout(120000);

    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockGetTransactionSuccess: true,
      },
      async (driver) => {
        const timerOpenSendPage = new TimerHelper(
          'Time to open send page from home',
          3000,
        );
        const timerAssetPicker = new TimerHelper(
          'Time to select SOL until the send form is loaded',
          2000,
        );
        const timerReviewTransaction = new TimerHelper(
          'Time to review the transaction until the confirmation page is loaded',
          5000,
        );

        // Home page is already loaded by withSolanaAccountSnap
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '50' });

        // Measure: Open send page
        await timerOpenSendPage.measure(async () => {
          await homePage.clickOnSendButton();
          const sendPage = new SendPage(driver);
          await sendPage.checkSolanaNetworkIsPresent();
        });
        performanceTracker.addTimer(timerOpenSendPage);

        // Measure: Select token and load form
        const sendPage = new SendPage(driver);
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'SOL',
        );
        await timerAssetPicker.measure(async () => {
          await sendPage.checkSendFormIsLoaded();
        });
        performanceTracker.addTimer(timerAssetPicker);

        // Measure: Review transaction
        await sendPage.fillRecipient(RECIPIENT_ADDRESS);
        await sendPage.fillAmount('0.1');
        await sendPage.pressContinueButton();
        await timerReviewTransaction.measure(async () => {
          const confirmation = new SnapTransactionConfirmation(driver);
          await confirmation.checkPageIsLoaded();
        });
        performanceTracker.addTimer(timerReviewTransaction);
      },
    );
  });
});
