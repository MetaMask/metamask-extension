import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';import { LAMPORTS_PER_SOL, SOL_BALANCE, SOL_TO_USD_RATE, USD_BALANCE, withSolanaAccountSnap } from './common-solana';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import SolanaHomepage from '../../page-objects/pages/home/solana-homepage';
import SendSolanaPage from '../../page-objects/pages/send/solana-send-page';


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
        assert.equal(await sendSolanaPage.isInsufficientBalanceDisplayed(), true)
      },
    );
  });
});
