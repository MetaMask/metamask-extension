import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import {
  defaultGanacheOptions,
  openDapp,
  regularDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';

/**
 * Connect Ledger hardware wallet without selecting an account
 *
 * @param {*} driver - Selenium driver
 */
async function connectLedger(driver: Driver) {
  // Open add hardware wallet modal
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement({ text: 'Add hardware wallet' });
  // This delay is needed to mitigate an existing bug in FF
  // See https://github.com/metamask/metamask-extension/issues/25851
  await driver.delay(regularDelayMs);
  // Select Ledger
  await driver.clickElement('[data-testid="connect-ledger-btn"]');
  await driver.clickElement({ text: 'Continue' });
}

async function addLedgerAccount(driver: Driver) {
  // Select first account of first page and unlock
  await driver.clickElement('.hw-account-list__item__checkbox');
  await driver.clickElement({ text: 'Unlock' });
}

describe('Ledger Hardware', function () {
  describe('from test dapp', () => {
    it('can personal sign', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          await unlockWallet(driver);
          await connectLedger(driver);
          await addLedgerAccount(driver);
          await openDapp(driver);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          // Sign
          await driver.clickElement('#personalSign');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const ethSignResult = await driver.findElement('#personalSignResult');
          const personalSignResultText = await ethSignResult.getText();
          const result =
            '0xa10b6707dd79e2f1f91ba243ab7abe15a46f58b052ad9cec170c5366ef5667c447a87eba2c0a9d4c9fbfa0a23e9db1fb55865d0568c32bd7cc681b8d0860e7af1b';
          assert.strictEqual(
            personalSignResultText.toUpperCase(),
            result.toUpperCase(),
            `personalSign result doesn't match expected value`,
          );

          // Verify
          await driver.clickElement({
            text: 'Verify',
            css: '#personalSignVerify',
            tag: 'button',
          });

          const personalSignVerifySigUtilResult = await driver.findElement(
            '#personalSignVerifySigUtilResult',
          );
          const personalSignVerifyECRecoverResult = await driver.findElement(
            '#personalSignVerifyECRecoverResult',
          );

          await driver.scrollToElement(personalSignVerifyECRecoverResult);
          const personalSignVerifySigUtilResultText =
            await personalSignVerifySigUtilResult.getText();
          const personalSignVerifyECRecoverResultText =
            await personalSignVerifyECRecoverResult.getText();
          assert.strictEqual(
            personalSignVerifySigUtilResultText.toUpperCase(),
            DEFAULT_FIXTURE_ACCOUNT.toUpperCase(),
            `personalSignVerifySigUtil result doesn't match default address account`,
          );
          assert.strictEqual(
            personalSignVerifyECRecoverResultText.toUpperCase(),
            DEFAULT_FIXTURE_ACCOUNT.toUpperCase(),
            `personalSignVerifyECRecover result doesn't match default address account`,
          );
        },
      );
    });

    it('can sign a typed V4 data', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          await unlockWallet(driver);
          await connectLedger(driver);
          await addLedgerAccount(driver);
          await openDapp(driver);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await driver.clickElement('#signTypedDataV4');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          await driver.clickElement({
            xpath: "//button[contains(@aria-label, 'Scroll down')]",
          });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const signTypedDataV4Result = await driver.findElement(
            '#signTypedDataV4Result',
          );
          const signTypedDataV4ResultText =
            await signTypedDataV4Result.getText();
          const result =
            '0xcd2f9c55840f5e1bcf61812e93c1932485b524ca673b36355482a4fbdf52f692684f92b4f4ab6f6c8572dacce46bd107da154be1c06939b855ecce57a1616ba71b';
          assert.strictEqual(
            signTypedDataV4ResultText.toUpperCase(),
            result.toUpperCase(),
            `signTypedDataV4 result doesn't match expected value`,
          );

          // Verify
          await driver.clickElement({
            text: 'Verify',
            css: '#signTypedDataV4Verify',
            tag: 'button',
          });

          const signTypedDataV4VerifyResult = await driver.findElement(
            '#signTypedDataV4VerifyResult',
          );
          await driver.scrollToElement(signTypedDataV4VerifyResult);
          const signTypedDataV4VerifyResultText =
            await signTypedDataV4VerifyResult.getText();
          assert.strictEqual(
            signTypedDataV4VerifyResultText.toUpperCase(),
            DEFAULT_FIXTURE_ACCOUNT.toUpperCase(),
            `signTypedDataV4Verify result doesn't match default address account`,
          );
        },
      );
    });

    it('can sign permit', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await connectLedger(driver);
          await addLedgerAccount(driver);
          await openDapp(driver);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await driver.clickElement('#signPermit');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const signPermitResult = await driver.findElement(
            '#signPermitResult',
          );
          const signPermitResultText = await signPermitResult.getText();
          const result =
            '0xf6555e4cc39bdec3397c357af876f87de00667c942f22dec555c28d290ed7d730103fe85c9d7c66d808a0a972f69ae00741a11df449475280772e7d9a232ea491b';
          assert.strictEqual(
            signPermitResultText.toUpperCase(),
            result.toUpperCase(),
            `signPermit result doesn't match expected value`,
          );
          await driver.clickElement({
            text: 'Verify',
            css: '#signPermitVerify',
            tag: 'button',
          });

          const signPermitVerifyResult = await driver.findElement(
            '#signPermitVerifyResult',
          );

          await driver.scrollToElement(signPermitVerifyResult);
          const signPermitVerifyResultText =
            await signPermitVerifyResult.getText();
          assert.strictEqual(
            signPermitVerifyResultText.toUpperCase(),
            DEFAULT_FIXTURE_ACCOUNT.toUpperCase(),
            `signPermitVerifyResult result doesn't match default address account`,
          );
        },
      );
    });

    it('can sign with ethereum', async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await unlockWallet(driver);
          await connectLedger(driver);
          await addLedgerAccount(driver);
          await openDapp(driver);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await driver.clickElement('#siwe');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
          const siweResult = await driver.findElement('#siweResult');
          const siweResultText = await siweResult.getText();
          const result =
            '0xef8674a92d62a1876624547bdccaef6c67014ae821de18fa910fbff56577a65830f68848585b33d1f4b9ea1c3da1c1b11553b6aabe8446717daf7cd1e38a68271c';
          assert.strictEqual(
            siweResultText.toUpperCase(),
            result.toUpperCase(),
            `signPermit result doesn't match expected value`,
          );
        },
      );
    });
  });
});
