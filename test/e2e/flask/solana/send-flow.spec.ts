import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';import { LAMPORTS_PER_SOL, SOL_BALANCE, SOL_TO_USD_RATE, USD_BALANCE, withSolanaAccountSnap } from './common-solana';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import SolanaHomepage from '../../page-objects/pages/home/solana-homepage';
import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';
import ConfirmSolanaTxPage from '../../page-objects/pages/send/solana-confirm-tx-page';


const EXPECTED_MAINNET_BALANCE_USD = `$${USD_BALANCE}`;

describe('Send SOL flow', function (this: Suite) {
  this.timeout(120000)
  it('with a zero balance account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), showNativeTokenAsMainBalance: true},
      async (driver) => {
        await driver.refresh()
        const homePage = new SolanaHomepage(driver)
        assert.equal(await homePage.check_ifSendButtonIsClickable(), true);
        assert.equal(await homePage.check_ifSwapButtonIsClickable(), false);
        assert.equal(await homePage.check_ifBridgeButtonIsClickable(), false);
        await homePage.clickOnSend();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(await sendSolanaPage.isContinueButtonEnabled(), false);
        await sendSolanaPage.setToAddress('GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna')
        assert.equal(await sendSolanaPage.isContinueButtonEnabled(), false);
        await sendSolanaPage.setAmount('0.1')
        assert.equal(await sendSolanaPage.isInsufficientBalanceDisplayed(), true, "Insufficiente balance text is not displayed")
      },
    );
  });
  it.only('with a positive balance account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), showNativeTokenAsMainBalance: true, mockCalls: true},
      async (driver) => {
        await driver.refresh()
        const homePage = new SolanaHomepage(driver)
        assert.equal(await homePage.check_ifSendButtonIsClickable(), true, "Send button is not enabled");
        assert.equal(await homePage.check_ifSwapButtonIsClickable(), false, "Swap button is enabled");
        assert.equal(await homePage.check_ifBridgeButtonIsClickable(), false, "Bridge button is enabled");
        await homePage.clickOnSend();
        const sendSolanaPage = new SendSolanaPage(driver);
        assert.equal(await sendSolanaPage.isContinueButtonEnabled(), false, "Continue button is enabled when no address nor amount");
        await sendSolanaPage.setToAddress('GYP1hGem9HBkYKEWNUQUxEwfmu4hhjuujRgGnj5LrHna')
        assert.equal(await sendSolanaPage.isContinueButtonEnabled(), false, "Continue button is enabled when no address");
        await sendSolanaPage.setAmount('0.1')
        assert.equal(await sendSolanaPage.isInsufficientBalanceDisplayed(), false, "Insufficiente balance text is displayed")
        await driver.delay(5000)
        //assert.equal(await sendSolanaPage.isContinueButtonEnabled(), true, "Continue button is not enabled when address and amount are set");
        await sendSolanaPage.clickOnContinue();
        const confirmSolanaPage = new ConfirmSolanaTxPage(driver);
        assert.equal(await confirmSolanaPage.checkAmountDisplayed('0.1'), true, "Check amount displayed is wrong");
        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('From'), true, "From is not displayed");
        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('Amount'), true, "Amount is not displayed");

        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('Recipient'), true, "Recipient is not displayed");
        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('Network'), true, "Network is not displayed");
        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('Transaction speed'), true, "Transaction speed is not displayed");

        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('Network fee'), true, "Network fee is not displayed");
        assert.equal(await confirmSolanaPage.isTrancsactionDetailDisplayed('Total'), true, "Total is not displayed");
      });
  });
});