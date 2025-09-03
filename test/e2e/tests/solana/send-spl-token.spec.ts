import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { commonSolanaAddress, withSolanaAccountSnap } from './common-solana';

const splTokenName = 'USDC';
// Investigate why this test is flaky https://consensyssoftware.atlassian.net/browse/MMQA-549
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('Send flow - SPL Token', function (this: Suite) {
  it('user with more than 1 token in the token list', async function () {
    this.timeout(120000);
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockGetTransactionSuccess: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded('50');
        await homePage.clickOnSendButton();
        const sendSolanaPage = new SendSolanaPage(driver);
        // await sendSolanaPage.checkPageIsLoaded('50 SOL'); // Get price might take a bit to get executed, so to avoid flakiness, wait until the call is made and mocked
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        assert.equal(
          await sendSolanaPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address',
        );
        await sendSolanaPage.openTokenList();
        await sendSolanaPage.checkTokenByNameIsDisplayed('SOL');

        await sendSolanaPage.checkTokenByNameIsDisplayed(splTokenName);

        await sendSolanaPage.selectTokenFromTokenList(splTokenName);

        await sendSolanaPage.checkAmountCurrencyIsDisplayed(splTokenName);

        await sendSolanaPage.checkTokenBalanceIsDisplayed(
          '8.908',
          splTokenName,
        );
        await sendSolanaPage.setAmount('0.1');
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        assert.equal(
          await confirmSolanaPage.checkAmountDisplayed('0.1', splTokenName),
          true,
          'Check amount displayed is wrong',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('From'),
          true,
          'From is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network is not displayed and it should',
        );
        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed(
            'Transaction speed',
          ),
          true,
          'Transaction speed is not displayed and it should',
        );

        assert.equal(
          await confirmSolanaPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee is not displayed and it should',
        );
        await confirmSolanaPage.clickOnSend();
        const sentTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await sentTxPage.checkTransactionStatusText(
            '0.1',
            true,
            splTokenName,
          ),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await sentTxPage.checkTransactionStatus(true),
          true,
          'Transaction was not sent as expected',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );

        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await sentTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed',
        );
        assert.equal(
          await sentTxPage.checkIsViewTransactionLinkDisplayed(),
          true,
          'View transaction link is not displayed and it should',
        );
      },
    );
  });

  it('and send transaction fails', async function () {
    this.timeout(120000); // there is a bug open for this big timeout https://consensyssoftware.atlassian.net/browse/SOL-90
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockGetTransactionFailed: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded('50');
        await homePage.clickOnSendButton();

        const sendSolanaPage = new SendSolanaPage(driver);
        // await sendSolanaPage.checkPageIsLoaded('50 SOL');
        await sendSolanaPage.setToAddress(commonSolanaAddress);
        await sendSolanaPage.openTokenList();
        await sendSolanaPage.selectTokenFromTokenList(splTokenName);
        await sendSolanaPage.checkAmountCurrencyIsDisplayed(splTokenName);
        await sendSolanaPage.setAmount('0.1');
        // assert.equal(await sendSolanaPage.isContinueButtonEnabled(), true, "Continue button is not enabled when address and amount are set");
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);

        await confirmSolanaPage.clickOnSend();
        const failedTxPage = new SolanaTxresultPage(driver);
        assert.equal(
          await failedTxPage.checkTransactionStatusText('0.1', false),
          true,
          'Transaction amount is not correct',
        );
        assert.equal(
          await failedTxPage.checkTransactionStatus(false),
          true,
          'Transaction did not fail as expected',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('From'),
          true,
          'From field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Recipient'),
          true,
          'Recipient field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Network'),
          true,
          'Network field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Transaction speed'),
          true,
          'Transaction field not displayed and it should',
        );
        assert.equal(
          await failedTxPage.isTransactionDetailDisplayed('Network fee'),
          true,
          'Network fee field not displayed and it should',
        );
      },
    );
  });
});
