import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import {
  confirmBitcoinSendAndAssertPending,
  landOnBitcoinSendScreen,
  waitForBitcoinSendConfirmation,
} from '../../../page-objects/flows/bitcoin-send.flow';
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

        const sendPage = await landOnBitcoinSendScreen(driver);
        await sendPage.fillRecipient({ recipientAddress: RECIPIENT_ADDRESS });
        await sendPage.fillAmount(SEND_AMOUNT);
        await sendPage.checkContinueButton({ state: 'enabled' });
        await sendPage.pressContinueButton();

        const activityTab = await confirmBitcoinSendAndAssertPending({
          driver,
          expectedAmount,
        });
        await bitcoinNode.mineBlocks();
        await waitForBitcoinSendConfirmation({
          activityTab,
          expectedAmount,
        });
      },
    );
  });
});
