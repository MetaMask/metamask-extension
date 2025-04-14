import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import {
  describeBrowserOnly,
} from '../multichain-api/testHelpers';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { connectSolanaTestDapp } from './testHelpers';
import { largeDelayMs } from '../../helpers';

describeBrowserOnly(Browser.CHROME, 'Solana Wallet Standard', function () {

  describe('Connect the dapp with solana Standard', function () {
    it('Should connect', async function () {
      await withSolanaAccountSnap(
        {
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          console.log('Solana account snap loaded');
          // const testDapp = new TestDappSolana(driver);
          // console.log('testDapp');
          // await testDapp.openTestDappPage();
          // console.log('openTestDappPage');

          // await driver.delay(largeDelayMs);
          // console.log('delay');

          // // await connectSolanaTestDapp(driver, testDapp);

          // const header = await testDapp.getHeader();
          // console.log('getHeader');
          // const connectionStatus = await header.getConnectionStatus();
          // console.log('getConnectionStatus');

          // assert.strictEqual(
          //   connectionStatus,
          //   'Connected',
          //   'Connection status should be "Connected"',
          // );
        },
      );
    });
  });
});
