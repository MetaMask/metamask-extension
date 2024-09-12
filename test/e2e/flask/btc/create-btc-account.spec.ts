import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import messages from '../../../../app/_locales/en/messages.json';

import {
  WALLET_PASSWORD,
  completeSRPRevealQuiz,
  getSelectedAccountAddress,
  openSRPRevealQuiz,
  removeSelectedAccount,
  tapAndHoldToRevealSRP,
} from '../../helpers';
import { createBtcAccount } from '../../accounts/common';
import { withBtcAccountSnap } from './common-btc';

describe('Create BTC Account', function (this: Suite) {
  it('create BTC account from the menu', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });
      },
    );
  });

  it('cannot create multiple BTC accounts', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.delay(500);
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );

        const createButton = await driver.findElement({
          text: messages.addNewBitcoinAccount.message,
          tag: 'button',
        });
        assert.equal(await createButton.isEnabled(), false);

        // modal will still be here
        await driver.clickElement('.mm-box button[aria-label="Close"]');

        // check the number of accounts. it should only be 2.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const menuItems = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(menuItems.length, 2);
      },
    );
  });

  it('can cancel the removal of BTC account', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-remove"]');
        await driver.clickElement({ text: 'Nevermind', tag: 'button' });

        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        // check the number of accounts. it should only be 2.
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const menuItems = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(menuItems.length, 2);
      },
    );
  });

  it('can recreate BTC account after deleting it', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        const accountAddress = await getSelectedAccountAddress(driver);
        await removeSelectedAccount(driver);

        // Recreate account
        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        const recreatedAccountAddress = await getSelectedAccountAddress(driver);
        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });

  it('can recreate BTC account after restoring wallet with SRP', async function () {
    await withBtcAccountSnap(
      { title: this.test?.fullTitle() },
      async (driver) => {
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        const accountAddress = await getSelectedAccountAddress(driver);

        await openSRPRevealQuiz(driver);
        await completeSRPRevealQuiz(driver);
        await driver.fill('[data-testid="input-password"]', WALLET_PASSWORD);
        await driver.press('[data-testid="input-password"]', driver.Key.ENTER);
        await tapAndHoldToRevealSRP(driver);
        const seedPhrase = await (
          await driver.findElement('[data-testid="srp_text"]')
        ).getText();

        // Reset wallet
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        const lockButton = await driver.findClickableElement(
          '[data-testid="global-menu-lock"]',
        );
        assert.equal(await lockButton.getText(), 'Lock MetaMask');
        await lockButton.click();

        await driver.clickElement({
          text: 'Forgot password?',
          tag: 'a',
        });

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          seedPhrase,
        );

        await driver.fill(
          '[data-testid="create-vault-password"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-vault-confirm-password"]',
          WALLET_PASSWORD,
        );

        await driver.clickElement({
          text: 'Restore',
          tag: 'button',
        });

        await createBtcAccount(driver);
        await driver.findElement({
          css: '[data-testid="account-menu-icon"]',
          text: 'Bitcoin Account',
        });

        const recreatedAccountAddress = await getSelectedAccountAddress(driver);
        assert(accountAddress === recreatedAccountAddress);
      },
    );
  });
});
