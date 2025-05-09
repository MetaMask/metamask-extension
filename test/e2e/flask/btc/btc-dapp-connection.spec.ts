import { Suite } from 'mocha';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';
import TestDapp from '../../page-objects/pages/test-dapp';
import { withBtcAccountSnap } from './common-btc';

describe('BTC Account - Dapp Connection', function (this: Suite) {
  // eslint-disable-next-line mocha/no-skipped-tests
  it.skip('cannot connect to dapps', async function () {
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
