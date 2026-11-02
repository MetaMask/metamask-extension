import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import {
  confirmBitcoinSendAndAssertPending,
  landOnBitcoinSendScreen,
} from '../../../page-objects/flows/bitcoin-send.flow';

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
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(TOTAL_BALANCE_SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        await confirmBitcoinSendAndAssertPending({ driver });
      },
    );
  });
});
