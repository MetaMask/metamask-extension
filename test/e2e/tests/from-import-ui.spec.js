const { strict: assert } = require('assert');
const path = require('path');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  largeDelayMs,
  completeImportSRPOnboardingFlow,
  completeImportSRPOnboardingFlowWordByWord,
} = require('../helpers');

describe('MetaMask Import UI', function () {
  it('Importing wallet using Secret Recovery Phrase', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    const testSeedPhrase =
      'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
    const testPassword = 'correct horse battery staple';
    const testAddress = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

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

        // Show account information
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );
        await driver.findVisibleElement('.qr-code__wrapper');
        // shows a QR code for the account
        const detailsModal = await driver.findVisibleElement('span .modal');
        // shows the correct account address
        const address = await driver.findElement('.qr-code__address');

        assert.equal(await address.getText(), testAddress);

        await driver.clickElement('.account-modal__close');
        await detailsModal.waitForElementState('hidden');

        // logs out of the account
        await driver.clickElement('.account-menu__icon .identicon');
        const lockButton = await driver.findClickableElement(
          '.account-menu__lock-button',
        );
        assert.equal(await lockButton.getText(), 'Lock');
        await lockButton.click();

        // accepts the account password after lock
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Create a new account
        // switches to localhost
        await driver.delay(largeDelayMs);
        await driver.clickElement('.network-display');
        await driver.clickElement({ text: 'Localhost', tag: 'span' });

        // choose Create Account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Create Account', tag: 'div' });

        // set account name
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // should show the correct account name
        const accountName = await driver.findElement('.selected-account__name');
        assert.equal(await accountName.getText(), '2nd account');

        // Switch back to original account
        // chooses the original account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement('.account-menu__name');

        // Send ETH from inside MetaMask
        // starts a send transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');
        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await driver.fill('.unit-input__input', '1');

        // Continue to next screen
        await driver.clickElement({ text: 'Next', tag: 'button' });

        // confirms the transaction
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // finds the transaction in the transactions list
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElements(
          '.transaction-list-item__primary-currency',
        );
        assert.equal(txValues.length, 1);
        assert.ok(/-1\s*ETH/u.test(await txValues[0].getText()));
      },
    );
  });

  it('Importing wallet using Secret Recovery Phrase with pasting word by word', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    const testSeedPhrase =
      'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
    const testPassword = 'correct horse battery staple';
    const testAddress = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';

    await withFixtures(
      {
        fixtures: 'onboarding',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeImportSRPOnboardingFlowWordByWord(
          driver,
          testSeedPhrase,
          testPassword,
        );

        // Show account information
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );
        await driver.findVisibleElement('.qr-code__wrapper');
        // shows the correct account address
        const address = await driver.findElement('.qr-code__address');

        assert.equal(await address.getText(), testAddress);
      },
    );
  });

  it('Import Account using private key', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    const testPrivateKey1 =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';
    const testPrivateKey2 =
      'F4EC2590A0C10DE95FBF4547845178910E40F5035320C516A18C117DE02B5669';

    await withFixtures(
      {
        fixtures: 'import-ui',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Imports an account with private key
        // choose Create Account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Import Account', tag: 'div' });

        // enter private key',
        await driver.fill('#private-key-box', testPrivateKey1);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should show the correct account name
        const importedAccountName = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await importedAccountName.getText(), 'Account 4');

        // should show the imported label
        await driver.clickElement('.account-menu__icon');
        // confirm 4th account is account 4, as expected
        const accountMenuItemSelector = '.account-menu__account:nth-child(4)';
        const fourthAccountName = await driver.findElement(
          `${accountMenuItemSelector} .account-menu__name`,
        );
        assert.equal(await fourthAccountName.getText(), 'Account 4');
        // confirm label is present on the same menu item
        const importedLabel = await driver.findElement(
          `${accountMenuItemSelector} .keyring-label`,
        );
        assert.equal(await importedLabel.getText(), 'IMPORTED');

        // Imports and removes an account
        // choose Create Account from the account menu
        await driver.clickElement({ text: 'Import Account', tag: 'div' });
        // enter private key
        await driver.fill('#private-key-box', testPrivateKey2);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should see new account in account menu
        const importedAccount2Name = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await importedAccount2Name.getText(), 'Account 5');
        await driver.clickElement('.account-menu__icon');
        const accountListItems = await driver.findElements(
          '.account-menu__account',
        );
        assert.equal(accountListItems.length, 5);

        await driver.clickPoint('.account-menu__icon', 0, 0);

        // should open the remove account modal
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__remove-account"]',
        );
        await driver.findElement('.confirm-remove-account__account');

        // should remove the account
        await driver.clickElement({ text: 'Remove', tag: 'button' });

        // Wait until selected account switches away from removed account to first account
        await driver.waitForSelector(
          {
            css: '.selected-account__name',
            text: 'Account 1',
          },
          { timeout: 10000 },
        );

        await driver.delay(regularDelayMs);
        await driver.clickElement('.account-menu__icon');

        const accountListItemsAfterRemoval = await driver.findElements(
          '.account-menu__account',
        );
        assert.equal(accountListItemsAfterRemoval.length, 4);
      },
    );
  });

  it('Import Account using json file', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };

    await withFixtures(
      {
        fixtures: 'import-ui',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Imports an account with JSON file
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Import Account', tag: 'div' });

        await driver.clickElement('.new-account-import-form__select');
        await driver.clickElement({ text: 'JSON File', tag: 'option' });

        const fileInput = await driver.findElement('input[type="file"]');
        const importJsonFile = path.join(
          __dirname,
          '..',
          'fixtures',
          'import-utc-json',
          'test-json-import-account-file.json',
        );

        fileInput.sendKeys(importJsonFile);

        await driver.fill('#json-password-box', 'foobarbazqux');

        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should show the correct account name
        const importedAccountName = await driver.findElement(
          '.selected-account__name',
        );
        assert.equal(await importedAccountName.getText(), 'Account 4');

        // should show the imported label
        await driver.clickElement('.account-menu__icon');
        // confirm 4th account is account 4, as expected
        const accountMenuItemSelector = '.account-menu__account:nth-child(4)';
        const fourthAccountName = await driver.findElement(
          `${accountMenuItemSelector} .account-menu__name`,
        );
        assert.equal(await fourthAccountName.getText(), 'Account 4');
        // confirm label is present on the same menu item
        const importedLabel = await driver.findElement(
          `${accountMenuItemSelector} .keyring-label`,
        );
        assert.equal(await importedLabel.getText(), 'IMPORTED');

        const accountListItems = await driver.findElements(
          '.account-menu__account',
        );
        assert.equal(accountListItems.length, 4);
      },
    );
  });

  it('Import Account using private key of an already active account should result in an error', async function () {
    const testPrivateKey =
      '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9';
    const ganacheOptions = {
      accounts: [
        {
          secretKey: testPrivateKey,
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };

    await withFixtures(
      {
        fixtures: 'import-ui',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // choose Import Account from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Import Account', tag: 'div' });

        // enter private key',
        await driver.fill('#private-key-box', testPrivateKey);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // error should occur
        await driver.waitForSelector({
          css: '.error',
          text: "The account you're are trying to import is a duplicate",
        });
      },
    );
  });

  it('Connects to a Hardware wallet', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };

    await withFixtures(
      {
        fixtures: 'import-ui',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // choose Connect Hardware Wallet from the account menu
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({
          text: 'Connect Hardware Wallet',
          tag: 'div',
        });
        await driver.delay(regularDelayMs);

        // should open the TREZOR Connect popup
        await driver.clickElement('.hw-connect__btn:nth-of-type(2)');
        await driver.delay(largeDelayMs * 2);
        await driver.clickElement({ text: 'Continue', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        const allWindows = await driver.getAllWindowHandles();
        assert.equal(allWindows.length, 2);
      },
    );
  });
});
