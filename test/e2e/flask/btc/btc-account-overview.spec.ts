import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_ACCOUNT_NAME, DEFAULT_BTC_BALANCE } from '../../constants';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Overview', function (this: Suite) {
  it('has balance displayed and has portfolio button enabled for BTC accounts', async function () {
    await withBtcAccountSnap(async (driver) => {
      const homePage = new BitcoinHomepage(driver);
      await homePage.check_pageIsLoaded();
      await homePage.headerNavbar.check_accountLabel(DEFAULT_BTC_ACCOUNT_NAME);

      assert.equal(await homePage.check_isSwapButtonEnabled(), false);
      assert.equal(await homePage.check_isBridgeButtonEnabled(), false);
      assert.equal(await homePage.check_isBuySellButtonEnabled(), true);
      assert.equal(await homePage.check_isReceiveButtonEnabled(), true);
      await homePage.check_portfolioLinkIsDisplayed();

      await homePage.check_isExpectedBitcoinBalanceDisplayed(
        DEFAULT_BTC_BALANCE,
      );
      await new AssetListPage(driver).check_tokenAmountIsDisplayed(
        `${DEFAULT_BTC_BALANCE} BTC`,
      );
    }, this.test?.fullTitle());
  });
});
