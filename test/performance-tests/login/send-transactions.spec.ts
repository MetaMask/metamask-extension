import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { ALL_POPULAR_NETWORKS } from '../../../app/scripts/fixtures/with-networks';
import { WITH_STATE_POWER_USER } from '../../e2e/benchmarks/constants';
import { withFixtures } from '../../e2e/helpers';
import HomePage from '../../e2e/page-objects/pages/home/homepage';
import { Driver } from '../../e2e/webdriver/driver';
import {
  setupPerformanceReporting,
  performanceTracker,
  TimerHelper,
} from '../utils/testSetup';
import LoginPage from '../../e2e/page-objects/pages/login-page';
import AssetListPage from '../../e2e/page-objects/pages/home/asset-list';
import SendPage from '../../e2e/page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../e2e/page-objects/pages/confirmations/snap-transaction-confirmation';

const RECIPIENT_ADDRESS = 'GxSJqxAyTjCjyDmPxdBBfVE9QwuMhEoHrPLRTmMyqxnU';

describe('Send Transactions Performance', function () {
  setupPerformanceReporting();

  it('measures send flow performance for native token', async function () {
    if (!process.env.INFURA_PROJECT_ID) {
      throw new Error(
        'Running this E2E test requires a valid process.env.INFURA_PROJECT_ID',
      );
    }

    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: (await generateWalletState(WITH_STATE_POWER_USER, true))
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
      },
      async ({ driver }: { driver: Driver }) => {
        const timerOpenSendPage = new TimerHelper(
          'Time to open send page from home',
          { chrome: 3000, firefox: 4000 },
        );
        const timerAssetPicker = new TimerHelper(
          'Time to select the token until the send form is loaded',
          { chrome: 2000, firefox: 3000 },
        );
        const timerReviewTransaction = new TimerHelper(
          'Time to review the transaction until the confirmation page is loaded',
          { chrome: 5000, firefox: 6000 },
        );

        // Login flow
        await driver.navigate();
        const loginPage = new LoginPage(driver);
        await loginPage.checkPageIsLoaded();
        await loginPage.loginToHomepage();
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenListIsDisplayed();

        // Measure: Open send page
        await homePage.startSendFlow();
        await timerOpenSendPage.measure(async () => {
          const sendPage = new SendPage(driver);
          await sendPage.checkNetworkFilterToggleIsDisplayed();
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
        await sendPage.fillAmount('0.00001');
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
