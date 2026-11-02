import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import { landOnBitcoinSendScreen } from '../../../page-objects/flows/bitcoin-send.flow';
import BitcoinReviewTxPage from '../../../page-objects/pages/send/bitcoin-review-tx-page';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
const SEND_AMOUNT = '0.5';

describe('Bitcoin Send', function (this: Suite) {
  this.timeout(300_000);

  it('displays the send amount, network fee, and total on review', async function () {
    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        // Keep exact fee and fiat-total assertions tied to static chain data.
        localNode: false,
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const reviewPage = new BitcoinReviewTxPage(driver);
        await reviewPage.checkPageIsLoaded();
        await reviewPage.checkSendAmountIsDisplayed(SEND_AMOUNT);
        await reviewPage.checkNetworkFeeIsDisplayed('0.00000281');
        await reviewPage.checkTotalAmountIsDisplayed('53381.50');
      },
    );
  });
});
