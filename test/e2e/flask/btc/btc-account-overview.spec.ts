import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_ACCOUNT_NAME } from '../../constants';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Overview', function (this: Suite) {
  it('has balance displayed and has portfolio button enabled for BTC accounts', async function () {
    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.checkPageIsLoaded();
      await homePage.headerNavbar.checkAccountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      assert.equal(await homePage.checkIsBridgeButtonEnabled(), false);
      assert.equal(await homePage.checkIsBuySellButtonEnabled(), true);
      assert.equal(await homePage.checkIsReceiveButtonEnabled(), true);
      await homePage.checkPortfolioLinkIsDisplayed();

      /* To be reactivated once we use a regtest network instead of mocked data
      await homePage.checkIsExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await new AssetListPage(driver).checkTokenAmountIsDisplayed(
        `${DEFAULT_BTC_BALANCE} BTC`,
      );
      */
    }, this.test?.fullTitle());
  });
});
