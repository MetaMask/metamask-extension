import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { DEFAULT_BTC_BALANCE } from '../../../constants';
import { TxToastNotification } from '../../../page-objects/components/tx-toast-notification';
import { login } from '../../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../../page-objects/flows/network.flow';
import ActivityTab from '../../../page-objects/pages/home/activity-tab';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import BitcoinReviewTxPage from '../../../page-objects/pages/send/bitcoin-review-tx-page';
import SendPage from '../../../page-objects/pages/send/send-page';
import { BitcoinNode } from '../../../seeder/bitcoin/node';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const SEND_AMOUNT = '0.5';

describe('Bitcoin Send', function (this: Suite) {
  this.timeout(180_000);

  it('confirms a partial-balance send after mining a local Bitcoin block', async function () {
    let bitcoinNode: BitcoinNode | undefined;
    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
        afterLocalNodesStart: ({ localNodes }) => {
          bitcoinNode = localNodes.find(
            (node): node is BitcoinNode => node instanceof BitcoinNode,
          );
        },
      },
      async ({ driver }) => {
        const expectedAmount = `-${SEND_AMOUNT} BTC`;
        if (!bitcoinNode) {
          throw new Error('Bitcoin local node was not started');
        }

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
        await sendPage.fillAmount(SEND_AMOUNT);
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
        await activityTab.checkWaitForTransactionStatusByAmount(
          expectedAmount,
          'pending',
        );
        await bitcoinNode.mineBlocks();
        await activityTab.checkWaitForTransactionStatusByAmount(
          expectedAmount,
          'confirmed',
          { timeout: 90_000 },
        );
      },
    );
  });
});
