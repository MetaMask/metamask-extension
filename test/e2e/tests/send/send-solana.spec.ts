import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/redesign/snap-transaction-confirmation';
import { DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS } from '../../flask/solana-wallet-standard/testHelpers';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { mockSendRedesignFeatureFlag } from './common';

describe('Send Solana', function () {
  it('it should be possible to send SOL', async function () {
    await withSolanaAccountSnap(
      {
        ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
        title: this.test?.fullTitle(),
        mockGetTransactionSuccess: true,
        withCustomMocks: mockSendRedesignFeatureFlag,
      },
      async (driver) => {
        const sendPage = new SendPage(driver);
        const nonEvmHomepage = new NonEvmHomepage(driver);
        const snapTransactionConfirmation = new SnapTransactionConfirmation(
          driver,
        );

        await nonEvmHomepage.clickOnSendButton();

        // Navigating immediate will not work - we wait in the asset page to catch up
        await driver.waitForSelector({
          text: '50 SOL',
        });

        await sendPage.createSendRequest({
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          symbol: 'SOL',
          recipientAddress: '7bYxDqvLQ4P8p6Vq3J6t1wczVwLk9h4Q9M5rjqvN1sVg',
          amount: '1',
        });

        await snapTransactionConfirmation.clickFooterCancelButton();
      },
    );
  });
});
