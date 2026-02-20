import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  buildSolanaTestSpecificMock,
  SOLANA_MANIFEST_FLAGS,
  SOLANA_IGNORED_CONSOLE_ERRORS,
} from '../solana/common-solana';

describe('Send Solana', function () {
  it('it should be possible to send SOL', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        manifestFlags: SOLANA_MANIFEST_FLAGS,
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionSuccess: true,
        }),
        ignoredConsoleErrors: SOLANA_IGNORED_CONSOLE_ERRORS,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
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
