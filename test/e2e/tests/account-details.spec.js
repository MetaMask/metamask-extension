const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { tEn } = require('../../lib/i18n-helpers');

describe('Show account details', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  const PASSWORD = 'correct horse battery staple';
  const wrongPassword = 'test test test test';

  async function revealPrivateKey(driver, useAccountMenu = true) {
    if (useAccountMenu) {
      await driver.clickElement('[data-testid="account-menu-icon"]');
      await driver.clickElement(
        '[data-testid="account-list-item-menu-button"]',
      );
      await driver.clickElement('[data-testid="account-list-menu-details"]');
    } else {
      // Global Menu
      await driver.clickElement('[data-testid="account-options-menu-button"]');
      await driver.clickElement('[data-testid="account-list-menu-details"]');
    }
    await driver.clickElement({ css: 'button', text: tEn('showPrivateKey') });

    await driver.fill('#account-details-authenticate', PASSWORD);
    await driver.press('#account-details-authenticate', driver.Key.ENTER);

    await driver.holdMouseDownOnElement(
      {
        text: tEn('holdToRevealPrivateKey'),
        tag: 'span',
      },
      2000,
    );

    const keyContainer = await driver.findElement(
      '[data-testid="account-details-key"]',
    );
    const key = await keyContainer.getText();
    return key;
  }

  it('should show the QR code for the account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-details"');

        const qrCode = await driver.findElement('.qr-code__wrapper');
        assert.equal(await qrCode.isDisplayed(), true);
      },
    );
  });

  it('should show the correct private key from account menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const key = await revealPrivateKey(driver);
        assert.equal(
          key,
          '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac',
        );
      },
    );
  });

  it('should show the correct private key for an unselected account from account menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Create and focus on different account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.fill('[placeholder="Account 2"]', '2nd account');
        await driver.clickElement({ text: tEn('create'), tag: 'button' });

        const key = await revealPrivateKey(driver);
        assert.equal(
          key,
          '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac',
        );
      },
    );
  });

  it('should show the correct private key from global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        const key = await revealPrivateKey(driver, false);
        assert.equal(
          key,
          '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac',
        );
      },
    );
  });

  it('should show the correct private key for a second account from global menu', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Create and focus on different account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-add-account"]',
        );
        await driver.fill('[placeholder="Account 2"]', '2nd account');
        await driver.clickElement({ text: tEn('create'), tag: 'button' });

        const key = await revealPrivateKey(driver, false);
        assert.equal(
          key,
          'f444f52ea41e3a39586d7069cb8e8233e9f6b9dea9cbb700cce69ae860661cc8',
        );
      },
    );
  });

  it('should not reveal private key when password is incorrect', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Attempt to reveal private key from account menu
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="account-list-item-menu-button"]',
        );
        await driver.clickElement('[data-testid="account-list-menu-details"]');
        await driver.clickElement({
          css: 'button',
          text: tEn('showPrivateKey'),
        });

        // Enter incorrect password
        await driver.fill('#account-details-authenticate', wrongPassword);
        await driver.press('#account-details-authenticate', driver.Key.ENTER);

        // Display error when password is incorrect
        const passwordErrorIsDisplayed = await driver.isElementPresent({
          css: '.mm-help-text',
          text: 'Incorrect Password.',
        });
        assert.equal(passwordErrorIsDisplayed, true);
      },
    );
  });
});
