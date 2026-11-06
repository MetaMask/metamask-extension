import { Suite } from 'mocha';
import {
  DEFAULT_BTC_BALANCE,
  DEFAULT_FIXTURE_ACCOUNT_ID,
} from '../../../constants';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { TxToastNotification } from '../../../page-objects/components/tx-toast-notification';
import { openActivityTransactionDetails } from '../../../page-objects/flows/activity.flow';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import BitcoinReviewTxPage from '../../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../../page-objects/pages/send/send-page';
import { BitcoinNode } from '../../../seeder/bitcoin/node';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import {
  bitcoinActivityControllerState,
  bitcoinSendActivityTransaction,
} from './bitcoin-activity-fixtures';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const CONFIRMED_AMOUNT = '0.2';
const FAILED_AMOUNT = '0.3';

describe('Bitcoin - Activity status', function (this: Suite) {
  this.timeout(180_000);

  it('shows confirmed and failed Bitcoin sends in the list and details', async function () {
    let bitcoinNode: BitcoinNode | undefined;
    const failedTransaction = bitcoinSendActivityTransaction({
      id: 'cd'.repeat(32),
      account: DEFAULT_FIXTURE_ACCOUNT_ID,
      amount: FAILED_AMOUNT,
      recipient: RECIPIENT_ADDRESS,
      status: 'failed',
    });

    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMultichainTransactionsController(
            bitcoinActivityControllerState(
              DEFAULT_FIXTURE_ACCOUNT_ID,
              failedTransaction,
            ),
          )
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        afterLocalNodesStart: ({ localNodes }) => {
          bitcoinNode = localNodes.find(
            (node): node is BitcoinNode => node instanceof BitcoinNode,
          );
        },
      },
      async ({ driver }) => {
        if (!bitcoinNode) {
          throw new Error('Bitcoin local node was not started');
        }

        await login(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await switchToNetworkFromNetworkSelect(driver, 'Bitcoin');
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
        await sendPage.fillRecipient({
          recipientAddress: RECIPIENT_ADDRESS,
        });
        await sendPage.fillAmount(CONFIRMED_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.clickConfirmButton();

        const txToast = new TxToastNotification(driver);
        await txToast.checkTxSubmittedToast();
        await txToast.closeToastNotification();

        await homePage.goToActivityList();
        const activityTab = new ActivityTab(driver);
        const confirmedAmount = `-${CONFIRMED_AMOUNT} BTC`;
        await activityTab.checkWaitForTransactionStatusByAmount(
          confirmedAmount,
          'pending',
        );

        await bitcoinNode.mineBlocks();
        await activityTab.checkWaitForTransactionStatusByAmount(
          confirmedAmount,
          'confirmed',
          { timeout: 90_000 },
        );

        await activityTab.checkTransactionActivityByText('Sent BTC');
        await activityTab.checkTransactionAmount(confirmedAmount);
        const confirmedDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Sent BTC',
        });
        await confirmedDetails.checkTitle('Sent BTC');
        await confirmedDetails.checkStatus('Confirmed');
        await confirmedDetails.checkAmount(confirmedAmount);
        await confirmedDetails.checkHashLinkPresent();
        await confirmedDetails.checkViewDetailsLink();
        await confirmedDetails.clickBackButton();

        await activityTab.checkTransactionActivityByText('Send failed');
        await activityTab.checkFailedTxNumberDisplayedInActivity(1);
        await activityTab.checkTransactionAmount(`-${FAILED_AMOUNT} BTC`);
        const failedDetails = await openActivityTransactionDetails({
          driver,
          activityTab,
          activityText: 'Send failed',
        });
        await failedDetails.checkTitle('Send failed');
        await failedDetails.checkStatus('Failed');
        await failedDetails.checkAmount(`-${FAILED_AMOUNT} BTC`);
        await failedDetails.checkHashLinkPresent();
        await failedDetails.checkViewDetailsLink();
        await failedDetails.clickBackButtonIfPresent();
      },
    );
  });
});
