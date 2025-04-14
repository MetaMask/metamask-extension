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
  this.timeout(300000); // do not remove this line

  describe('Connect the dapp with solana Standard', function () {
    it('Should connect', async function () {
      await withSolanaAccountSnap(
        {
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();

          await testDapp.switchTo();

          await driver.delay(largeDelayMs);

          await connectSolanaTestDapp(driver, testDapp);

          const header = await testDapp.getHeader();

          const connectionStatus = await header.getConnectionStatus();
          assert.strictEqual(
            connectionStatus,
            'Connected',
            'Connection status should be "Connected"',
          );

          const account = await header.getAccount();
          assert.strictEqual(
            account,
            '4tE7...Uxer',
            'Connection status should be "4tE7...Uxer"',
          );
        },
      );
    });
  });
});
