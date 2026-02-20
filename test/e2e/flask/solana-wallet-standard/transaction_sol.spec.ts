import { strict as assert } from 'assert';
import { By } from 'selenium-webdriver';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { WINDOW_TITLES } from '../../constants';
import { largeDelayMs, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  buildSolanaTestSpecificMock,
  SOLANA_MANIFEST_FLAGS,
  SOLANA_IGNORED_CONSOLE_ERRORS,
} from '../../tests/solana/common-solana';
import {
  clickCancelButton,
  clickConfirmButton,
  connectSolanaTestDapp,
  DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS,
} from './testHelpers';

describe('Solana Wallet Standard - Transfer SOL', function () {
  describe('Send a transaction', function () {
    it('Should send a transaction', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
          dappOptions: DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS.dappOptions,
          manifestFlags: SOLANA_MANIFEST_FLAGS,
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
          }),
          ignoredConsoleErrors: SOLANA_IGNORED_CONSOLE_ERRORS,
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            includeDevnet: true,
          });

          // 1. Sign a transfer transaction
          const sendSolTest = await testDapp.getSendSolTest();
          await sendSolTest.signTransaction();

          // Confirm the signature
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          await driver.delay(largeDelayMs);
          const signedTransaction = await sendSolTest.getSignedTransaction();
          assert.strictEqual(signedTransaction.length, 1);
          assert.ok(signedTransaction[0]);

          // 2. Send the transaction
          await sendSolTest.sendTransaction();

          // Confirm the transaction
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          // Assert that a transaction hash is received
          await driver.delay(largeDelayMs);
          const transactionHash = await sendSolTest.getTransactionHash();
          assert.ok(transactionHash);
        },
      );
    });

    it('Should be able to cancel a transaction and send another one', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilder().build(),
          title: this.test?.fullTitle(),
          dappOptions: DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS.dappOptions,
          manifestFlags: SOLANA_MANIFEST_FLAGS,
          testSpecificMock: buildSolanaTestSpecificMock({
            mockGetTransactionSuccess: true,
          }),
          ignoredConsoleErrors: SOLANA_IGNORED_CONSOLE_ERRORS,
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);
          const testDapp = new TestDappSolana(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await connectSolanaTestDapp(driver, testDapp, {
            includeDevnet: true,
          });

          // 1. Start a transaction and cancel it
          const sendSolTest = await testDapp.getSendSolTest();
          await sendSolTest.sendTransaction();

          // Cancel the sendTransaction
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickCancelButton(driver);
          await testDapp.switchTo();

          // 2. Send another transaction
          await sendSolTest.sendTransaction();

          // Confirm the transaction
          await driver.delay(largeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await clickConfirmButton(driver);
          await testDapp.switchTo();

          // Assert that a transaction hash is received
          await driver.delay(largeDelayMs);
          const transactionHash = await sendSolTest.getTransactionHash();
          assert.ok(transactionHash);
        },
      );
    });

    describe('Given I have connected to Mainnet and Devnet', function () {
      it('Should use the Devnet scope as specified by the Dapp', async function () {
        await withFixtures(
          {
            fixtures: new FixtureBuilder().build(),
            title: this.test?.fullTitle(),
            dappOptions: DEFAULT_SOLANA_TEST_DAPP_FIXTURE_OPTIONS.dappOptions,
            manifestFlags: SOLANA_MANIFEST_FLAGS,
            testSpecificMock: buildSolanaTestSpecificMock({
              mockGetTransactionSuccess: true,
            }),
            ignoredConsoleErrors: SOLANA_IGNORED_CONSOLE_ERRORS,
          },
          async ({ driver }) => {
            await loginWithBalanceValidation(driver);
            const testDapp = new TestDappSolana(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await connectSolanaTestDapp(driver, testDapp, {
              includeDevnet: true,
            });

            // Send a transaction
            const sendSolTest = await testDapp.getSendSolTest();
            await sendSolTest.sendTransaction();

            // Confirm the signature
            await driver.delay(largeDelayMs);
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

            // Look for the target chain to be set to Devnet
            const permission = await driver.findElement(
              By.xpath("//p[contains(text(), 'Solana Devnet')]"),
            );
            assert.ok(permission);

            // Confirm connection
            await driver.clickElement({ text: 'Confirm', tag: 'span' });
          },
        );
      });
    });
  });
});
