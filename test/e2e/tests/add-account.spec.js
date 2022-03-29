const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  completeImportSRPOnboardingFlow,
} = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');

describe('Add account', function () {
  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
  const testPassword = 'correct horse battery staple';
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should display correct new account name after create', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        const accountName = await driver.waitForSelector({
          css: '.selected-account__name',
          text: '2nd',
        });
        assert.equal(await accountName.getText(), '2nd account');
      },
    );
  });

  it('should add the same account addresses when a secret recovery phrase is imported, the account is locked, and the same secret recovery phrase is imported again', async function () {
    await withFixtures(
      {
        fixtures: 'onboarding',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeImportSRPOnboardingFlow(
          driver,
          testSeedPhrase,
          testPassword,
        );

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );

        const detailsModal = await driver.findVisibleElement('span .modal');
        // get the public address for the "second account"
        await driver.waitForSelector('.qr-code__address');
        const secondAccountAddress = await driver.findElement(
          '.qr-code__address',
        );
        const secondAccountPublicAddress = await secondAccountAddress.getText();

        await driver.clickElement('.account-modal__close');
        await detailsModal.waitForElementState('hidden');

        // generate a third accound
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '3rd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );

        // get the public address for the "third account"
        const secondDetailsModal = await driver.findVisibleElement(
          'span .modal',
        );
        await driver.waitForSelector('.qr-code__address');
        const thirdAccountAddress = await driver.findElement(
          '.qr-code__address',
        );
        const thirdAccountPublicAddress = await thirdAccountAddress.getText();

        await driver.clickElement('.account-modal__close');
        await secondDetailsModal.waitForElementState('hidden');

        // lock account
        await driver.clickElement('.account-menu__icon');
        await driver.delay(regularDelayMs);

        const lockButton = await driver.findClickableElement(
          '.account-menu__lock-button',
        );
        await lockButton.click();
        await driver.delay(regularDelayMs);

        // restore same seed phrase
        const restoreSeedLink = await driver.findClickableElement(
          '.unlock-page__link',
        );

        await restoreSeedLink.click();
        await driver.delay(regularDelayMs);

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          testSeedPhrase,
        );

        await driver.fill('#password', 'correct horse battery staple');
        await driver.fill('#confirm-password', 'correct horse battery staple');
        await driver.clickElement({
          text: enLocaleMessages.restore.message,
          tag: 'button',
        });
        await driver.delay(regularDelayMs);

        // recreate a "2nd account"
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );
        const thirdDetailsModal = await driver.findVisibleElement(
          'span .modal',
        );
        // get the public address for the "second account"
        await driver.waitForSelector('.qr-code__address');
        const recreatedSecondAccountAddress = await driver.findElement(
          '.qr-code__address',
        );

        assert.equal(
          await recreatedSecondAccountAddress.getText(),
          secondAccountPublicAddress,
        );

        await driver.clickElement('.account-modal__close');
        await thirdDetailsModal.waitForElementState('hidden');

        // re-generate a third accound
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '3rd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );

        // get the public address for the "third account"
        await driver.waitForSelector('.qr-code__address');
        const recreatedThirdAccountAddress = await driver.findElement(
          '.qr-code__address',
        );
        assert.strictEqual(
          await recreatedThirdAccountAddress.getText(),
          thirdAccountPublicAddress,
        );
      },
    );
  });

  it('It should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding', async function () {
    const testPrivateKey =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.delay(regularDelayMs);

        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        const menuItems = await driver.findElements('.menu-item');
        assert.equal(menuItems.length, 3);

        // click out of menu
        await driver.clickElement('.menu__background');

        // import with private key
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Import Account', tag: 'div' });

        // enter private key',
        await driver.fill('#private-key-box', testPrivateKey);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should show the correct account name
        const importedAccountName = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await importedAccountName.getText(), 'Account 3');

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        const menuItems2 = await driver.findElements('.menu-item');
        assert.equal(menuItems2.length, 4);

        await driver.findElement(
          '[data-testid="account-options-menu__remove-account"]',
        );
      },
    );
  });
});
