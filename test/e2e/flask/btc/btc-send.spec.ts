import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE, DEFAULT_BTC_FEE_RATE } from '../../constants';
import BitcoinSendPage from '../../page-objects/pages/send/bitcoin-send-page';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import BitcoinReviewTxPage from '../../page-objects/pages/send/bitcoin-review-tx-page';
import { withBtcAccountSnap } from './common-btc';

// To be reactivated once we use a regtest network instead of mocked data
// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('BTC Account - Send', function (this: Suite) {
  const recipientAddress = 'bc1qsqvczpxkgvp3lw230p7jffuuqnw9pp4j5tawmf';
  it('fields validation', async function () {
    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.checkIsExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();

      const bitcoinSendPage = new BitcoinSendPage(driver);
      await bitcoinSendPage.checkPageIsLoaded();
      assert.equal(await bitcoinSendPage.checkAssetPickerIsDisplayed(), false);
      assert.equal(await bitcoinSendPage.checkAmountFieldIsDisplayed(), false);
      await bitcoinSendPage.fillRecipientAddress('invalidBTCAddress');
      await bitcoinSendPage.checkAddressFieldValidationError(
        'Invalid Bitcoin address',
      );
      assert.equal(await bitcoinSendPage.checkContinueButtonIsDisabled(), true);
      await bitcoinSendPage.fillRecipientAddress(recipientAddress);
      assert.equal(await bitcoinSendPage.checkContinueButtonIsDisabled(), true);
      await bitcoinSendPage.fillAmount('50');
      await bitcoinSendPage.checkAmountValidationError(
        'Funds are insufficient to cover amount plus fee',
      );
      assert.equal(await bitcoinSendPage.checkContinueButtonIsDisabled(), true);
      await bitcoinSendPage.fillAmount('0');
      await bitcoinSendPage.checkAmountValidationError(
        'Amount below dust limit',
      );
      assert.equal(await bitcoinSendPage.checkContinueButtonIsDisabled(), true);
      await bitcoinSendPage.fillAmount('0.1');
      await driver.delay(1000);
      assert.equal(
        await bitcoinSendPage.checkContinueButtonIsDisabled(),
        false,
      );
      await bitcoinSendPage.clearRecipientAddress();
      await driver.delay(1000);
      assert.equal(await bitcoinSendPage.checkContinueButtonIsDisabled(), true);
    }, this.test?.fullTitle());
  });

  it('can complete the send flow', async function () {
    const sendAmount = '0.5';
    const expectedFee = '281';
    const expectedTotal = '0.50000281';

    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.checkIsExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();

      const bitcoinSendPage = new BitcoinSendPage(driver);
      await bitcoinSendPage.checkPageIsLoaded();
      await bitcoinSendPage.fillRecipientAddress(recipientAddress);
      await bitcoinSendPage.fillAmount(sendAmount);
      await bitcoinSendPage.clickContinueButton();

      // ------------------------------------------------------------------------------
      // From here, we have moved to the confirmation screen (second part of the flow).

      const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
      await bitcoinReviewTxPage.checkPageIsLoaded();
      await bitcoinReviewTxPage.checkSendAmountIsDisplayed(sendAmount);
      await bitcoinReviewTxPage.checkNetworkFeeIsDisplayed(expectedFee);
      await bitcoinReviewTxPage.checkFeeRateIsDisplayed(
        Math.floor(DEFAULT_BTC_FEE_RATE).toString(),
      );
      await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(expectedTotal);
      await bitcoinReviewTxPage.clickSendButton();

      // TODO: Test that the transaction appears in the activity tab once activity tab is implemented for Bitcoin
      await homePage.checkPageIsLoaded();
    }, this.test?.fullTitle());
  });

  it('can send the max amount', async function () {
    const expectedFee = 0.00000219;

    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.checkIsExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await homePage.startSendFlow();

      const bitcoinSendPage = new BitcoinSendPage(driver);
      await bitcoinSendPage.checkPageIsLoaded();
      await bitcoinSendPage.fillRecipientAddress(recipientAddress);
      await bitcoinSendPage.selectMaxAmount();
      await bitcoinSendPage.clickContinueButton();

      // ------------------------------------------------------------------------------
      // From here, we have moved to the confirmation screen (second part of the flow).

      const bitcoinReviewTxPage = new BitcoinReviewTxPage(driver);
      await bitcoinReviewTxPage.checkPageIsLoaded();
      await bitcoinReviewTxPage.checkSendAmountIsDisplayed(
        (DEFAULT_BTC_BALANCE - expectedFee).toString(),
      );
      await bitcoinReviewTxPage.checkTotalAmountIsDisplayed(
        DEFAULT_BTC_BALANCE.toString(),
      );
      await bitcoinReviewTxPage.clickSendButton();

      // TODO: Test that the transaction appears in the activity tab once activity tab is implemented for Bitcoin
      await homePage.checkPageIsLoaded();
    }, this.test?.fullTitle());
  });
});
