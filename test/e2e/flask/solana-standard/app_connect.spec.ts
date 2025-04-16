import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { describeBrowserOnly } from '../multichain-api/testHelpers';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
  switchToAccount,
} from './testHelpers';
import { largeDelayMs, WINDOW_TITLES } from '../../helpers';

describeBrowserOnly(Browser.CHROME, 'Solana Wallet Standard', function () {
  this.timeout(300000); // do not remove this line

  describe('Connect the dapp with solana Standard', function () {
    it('Should connect', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
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

  describe('Disconnect the dapp', function () {
    it('Should disconnect', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
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

          await header.disconnect();

          const connectionStatusAfterDisconnect =
            await header.getConnectionStatus();
          assert.strictEqual(
            connectionStatusAfterDisconnect,
            'Not connected',
            'Connection status should be "Disconnected"',
          );
        },
      );
    });
  });

  describe('Switch account', function () {
    describe('Given I have two accounts', function () {
      it('Should be able to switch between them', async function () {
        await withSolanaAccountSnap(
          {
            ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            numberOfAccounts: 2,
          },
          async (driver) => {
            const testDapp = new TestDappSolana(driver);
            await testDapp.openTestDappPage();
            await driver.delay(largeDelayMs);
            await connectSolanaTestDapp(driver, testDapp, {
              selectAllAccounts: true,
            });

            // Check that we're connected to the second account
            const header = await testDapp.getHeader();
            const account = await header.getAccount();
            assert.strictEqual(account, 'ExTE...GNtt');

            // Switch to the first account
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            await switchToAccount(driver, 'Solana 1');
            await testDapp.switchTo();

            // Check that we're connected to the first account
            const account2 = await header.getAccount();
            assert.strictEqual(account2, '4tE7...Uxer');
          },
        );
      });
    });
  });
});
