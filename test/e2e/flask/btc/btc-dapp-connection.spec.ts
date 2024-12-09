import { Suite } from 'mocha';
import { withBtcAccountSnap } from './common-btc';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import TestDapp from '../../page-objects/pages/test-dapp';

describe('BTC Account - Dapp Connection', function (this: Suite) {
  it('cannot connect to dapps', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        const homePage = new BitcoinHomepage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.headerNavbar.check_accountLabel('Bitcoin Account');

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();
        await testDapp.connectAccount({
          connectAccountButtonEnabled: false,
        });
      },
    );
  });
});
