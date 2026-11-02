import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { withBitcoinFixtures } from '../../btc/fixtures/with-bitcoin-fixtures';
import { landOnBitcoinSendScreen } from '../../../page-objects/flows/bitcoin-send.flow';

describe('Bitcoin Send', function (this: Suite) {
  this.timeout(300_000);

  it('displays an error for an invalid recipient address', async function () {
    await withBitcoinFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({
          recipientAddress: 'invalidBTCAddress',
          validAddress: false,
        });
        await sendPage.checkInvalidAddressError();
      },
    );
  });
});
