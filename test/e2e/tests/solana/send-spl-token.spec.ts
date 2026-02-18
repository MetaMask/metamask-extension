import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';
import SolanaTxresultPage from '../../page-objects/pages/send/solana-tx-result-page';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { commonSolanaAddress, mockBridgeTxStatus, mockGetFeeForMessage, mockGetLatestBlockhash, mockGetMinimumBalanceForRentExemption, mockGetMintAccountInfo, mockGetMultipleAccounts, mockGetSignaturesForWalletOnly, mockGetSOLUSDCTransaction, mockGetTokenAccountsUSDCOnly, mockMultiCoinPrice, mockPriceApiExchangeRates, mockPriceApiSpotPriceSwap, mockQuoteFromSoltoUSDC, mockSendSwapSolanaTransaction, mockSolanaBalanceQuote, mockTokenApiAssets, SignatureHolder, simulateSolanaTransaction, withSolanaAccountSnap } from './common-solana';
import SendPage from 'test/e2e/page-objects/pages/send/send-page';
import { withFixtures } from 'test/e2e/helpers';
import FixtureBuilder from 'test/e2e/fixtures/fixture-builder';
import { MockedEndpoint, Mockttp } from 'mockttp';
import SnapTransactionConfirmation from 'test/e2e/page-objects/pages/confirmations/snap-transaction-confirmation';

const splTokenName = 'USDC';

async function mockSwapSOLtoUSDC(
  mockServer: Mockttp,
): Promise<MockedEndpoint[]> {
  const signatureHolder: SignatureHolder = { value: '' };

  return [
    await mockGetTokenAccountsUSDCOnly(mockServer, signatureHolder),
    await simulateSolanaTransaction(mockServer),
    await mockSolanaBalanceQuote(mockServer, false),
    await mockGetFeeForMessage(mockServer),
    await mockGetLatestBlockhash(mockServer),
    await mockGetMinimumBalanceForRentExemption(mockServer),
    await mockQuoteFromSoltoUSDC(mockServer),
    await mockMultiCoinPrice(mockServer),
    await mockPriceApiSpotPriceSwap(mockServer),
    await mockPriceApiExchangeRates(mockServer),
    await mockGetMultipleAccounts(mockServer),
    await mockSendSwapSolanaTransaction(mockServer, signatureHolder),
    await mockGetSOLUSDCTransaction(mockServer, signatureHolder),
    await mockGetMintAccountInfo(mockServer),
    await mockGetSignaturesForWalletOnly(mockServer, signatureHolder),
    await mockBridgeTxStatus(mockServer),
    await mockTokenApiAssets(mockServer),
  ];
}
// Investigate why this test is flaky https://consensyssoftware.atlassian.net/browse/MMQA-549
// eslint-disable-next-line mocha/no-skipped-tests
describe('Send flow - SPL Token', function (this: Suite) {
  it('user with more than 1 token in the token list', async function () {
    this.timeout(120000);
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapSOLtoUSDC,
      },
      async ({ driver }) => {
        const homePage = new NonEvmHomepage(driver);
        const sendPage = new SendPage(driver);
        await homePage.checkPageIsLoaded({ amount: '50' });
        await homePage.clickOnSendButton();
        await sendPage.checkSolanaNetworkIsPresent();
        await sendPage.selectNetworkByName('Solana');
        await driver.delay(10000000);
        await sendPage.selectToken(
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          'SOL',
        );

        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          false,
          'Continue button is enabled when no address nor amount',
        );
        await sendPage.fillRecipient(commonSolanaAddress);
        await sendPage.fillAmount('0.1');
        assert.equal(
          await sendPage.isContinueButtonEnabled(),
          true,
          'Continue button should be enabled',
        );

        await sendPage.pressContinueButton();

        const confirmation = new SnapTransactionConfirmation(driver);
        await confirmation.checkPageIsLoaded();
        await confirmation.checkAccountIsDisplayed('Account 1');
        await confirmation.clickFooterConfirmButton();

        const activityList = new ActivityListPage(driver);
        await activityList.checkTxAction({ action: 'Sent' });
        await activityList.checkTxAmountInActivity('-0.00708 SOL', 1);
        await activityList.checkNoFailedTransactions();
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
        await homePage.checkPageIsLoaded({ amount: '50' });
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
