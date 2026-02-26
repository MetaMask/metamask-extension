import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendPage from '../../page-objects/pages/send/send-page';
import SnapTransactionConfirmation from '../../page-objects/pages/confirmations/snap-transaction-confirmation';
import { SOLANA_MAINNET_SCOPE } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { buildSolanaTestSpecificMock } from '../solana/common-solana';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';

describe('Send Solana', function () {
  it('it should be possible to send SOL', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({
          mockGetTransactionSuccess: true,
        }),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
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
          chainId: SOLANA_MAINNET_SCOPE,
          symbol: 'SOL',
          recipientAddress: '7bYxDqvLQ4P8p6Vq3J6t1wczVwLk9h4Q9M5rjqvN1sVg',
          amount: '1',
        });

        await snapTransactionConfirmation.clickFooterCancelButton();
      },
    );
  });
});
