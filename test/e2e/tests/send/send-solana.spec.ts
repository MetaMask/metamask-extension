import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
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
        const sendSolanaPage = new SendSolanaPage(driver);
        const nonEvmHomepage = new NonEvmHomepage(driver);
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        const sentTxPage = new SolanaTxresultPage(driver);

        // Navigating immediate will not work - we wait in the asset page to catch up
        await driver.waitForSelector({
          text: '50 SOL',
        });
        await nonEvmHomepage.clickOnSendButton();
        await sendSolanaPage.checkPageIsLoaded();
        await sendSolanaPage.setToAddress(
          '7bYxDqvLQ4P8p6Vq3J6t1wczVwLk9h4Q9M5rjqvN1sVg',
        );
        await sendSolanaPage.setAmount('1');
        await sendSolanaPage.clickOnContinue();
        await confirmSolanaPage.clickOnSend();
        await sentTxPage.checkTransactionStatusText('1', true);
        await sentTxPage.checkTransactionStatus(true);
      },
    );
  });
});
