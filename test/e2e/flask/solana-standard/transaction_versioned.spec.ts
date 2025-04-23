import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { withSolanaAccountSnap } from '../solana/common-solana';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import {
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';
import { WINDOW_TITLES } from '../../helpers';

describe('Solana Wallet Standard - Send Versioned transaction', function () {
  this.timeout(3000000);

  describe('Send Versioned transactions', function () {
    it('Should sign and send a versioned transaction', async function () {
      await withSolanaAccountSnap(
        {
          ...DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
          title: this.test?.fullTitle(),
          mockCalls: true,
          simulateTransaction: false,
          mockSendTransaction: true,
        },
        async (driver) => {
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await connectSolanaTestDapp(driver, testDapp, {
            includeDevnet: true,
          });

          const sendSolVersionedTest = await testDapp.getSendSolVersionedTest();
          await sendSolVersionedTest.signTransaction();

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          const signedTransaction =
            await sendSolVersionedTest.getSignedTransaction();
          assert.strictEqual(signedTransaction.length, 1);
          assert.ok(signedTransaction[0]);

          await sendSolVersionedTest.sendTransaction();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          const transactionHash =
            await sendSolVersionedTest.getSolscanShortContent();
          assert.ok(transactionHash);
        },
      );
    });
  });
});
