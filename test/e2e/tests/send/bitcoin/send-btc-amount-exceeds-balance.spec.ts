import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import { landOnBitcoinSendScreen } from '../../../page-objects/flows/bitcoin-send.flow';

const RECIPIENT_ADDRESS = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';

describe('Bitcoin Send', function (this: Suite) {
  this.timeout(300_000);

  it('displays an error when the amount exceeds the balance', async function () {
    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount('5');
        await sendPage.checkInsufficientFundsError();
      },
    );
  });
});
