import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { DEFAULT_BTC_BALANCE } from '../../constants';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Overview', function (this: Suite) {
  it('has balance displayed and has portfolio button enabled for BTC accounts', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const homePage = new BitcoinHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.headerNavbar.check_accountLabel('Bitcoin Account');
        await homePage.check_expectedBitcoinBalanceIsDisplayed(
          DEFAULT_BTC_BALANCE,
        );
        assert.equal(await homePage.check_ifBridgeButtonIsEnabled(), false);
        assert.equal(await homePage.check_ifSwapButtonIsEnabled(), false);
        assert.equal(await homePage.check_ifBuySellButtonIsEnabled(), true);
        assert.equal(await homePage.check_ifReceiveButtonIsEnabled(), true);
      },
    );
  });
});
