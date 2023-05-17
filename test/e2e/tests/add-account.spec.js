const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  completeImportSRPOnboardingFlow,
  sendTransaction,
  findAnotherAccountFromAccountList,
} = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');
const FixtureBuilder = require('../fixture-builder');

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
  const firstAccount = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';
  const secondAccount = '0x3ED0eE22E0685Ebbf07b2360A8331693c413CC59';

  it('should display correct new account name after create', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );

        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });
        const accountName = await driver.waitForSelector({
          css: '[data-testid="account-menu-icon"]',
          text: '2nd',
        });
        assert.equal(await accountName.getText(), '2nd account');
      },
    );
  });

  it('should not affect public address when using secret recovery phrase to recover account with non-zero balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        // On boarding with 1st account
        await completeImportSRPOnboardingFlow(
          driver,
          testSeedPhrase,
          testPassword,
        );

        // Check address of 1st account
        const firstAccountPublicAddress = await checkAccountDetails(driver);
        assert.equal(firstAccountPublicAddress, firstAccount);
        await driver.delay(regularDelayMs);

        // Create a new account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Check address of 2nd account
        const secondAccountPublicAddress = await checkAccountDetails(driver);
        assert.strictEqual(secondAccountPublicAddress, secondAccount);
        await driver.delay(regularDelayMs);

        // Give 2nd locally account some balance so it will not be removed after recovering SRP
        const accountOneSelector = await findAnotherAccountFromAccountList(
          driver,
          1,
          'Account 1',
        );
        await driver.clickElement(accountOneSelector);
        await sendTransaction(driver, secondAccount, '2.8');

        // Lock the account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="global-menu-lock"]');
        await driver.delay(regularDelayMs);

        // Recover via SRP in "forget password" option
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

        // Land in 1st account home page
        await driver.findElement('.home__main-view');

        // Check address of 1st account
        const restoredFirstAccountPublicAddress = await checkAccountDetails(
          driver,
        );
        assert.equal(restoredFirstAccountPublicAddress, firstAccount);
        await driver.delay(regularDelayMs);
        // Check address of 2nd account
        const accountTwoSelector = await findAnotherAccountFromAccountList(
          driver,
          2,
          'Account 2',
        );
        await driver.clickElement(accountTwoSelector);
        const restoredSecondAccountPublicAddress = await checkAccountDetails(
          driver,
        );
        assert.equal(restoredSecondAccountPublicAddress, secondAccount);
      },
    );
  });

  it('It should be possible to remove an account imported with a private key, but should not be possible to remove an account generated from the SRP imported in onboarding', async function () {
    const testPrivateKey =
      '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.delay(regularDelayMs);

        await driver.clickElement('[data-testid="account-menu-icon"]');

        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Show account list menu for second account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        const menuItems = await driver.findElements('.menu-item');
        assert.equal(menuItems.length, 2);

        // click out of menu
        await driver.clickElement('.menu__background');

        // import with private key
        await driver.clickElement({ text: 'Import account', tag: 'button' });

        // enter private key',
        await driver.fill('#private-key-box', testPrivateKey);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // should show the correct account name
        const importedAccountName = await driver.findElement(
          '[data-testid="account-menu-icon"]',
        );
        assert.equal(await importedAccountName.getText(), 'Account 3');

        // Open account menu again
        await driver.clickElement('[data-testid="account-menu-icon"]');

        // Show account list menu for second account
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );

        const importedMenuItems = await driver.findElements('.menu-item');
        assert.equal(importedMenuItems.length, 3);

        await driver.findElement('[data-testid="account-list-menu-remove"]');
      },
    );
  });
});

async function checkAccountDetails(driver) {
  // Open account menu again
  await driver.clickElement('[data-testid="account-menu-icon"]');

  // Select account details for second account
  await driver.clickElement(
    '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
  )
  await driver.clickElement('[data-testid="account-list-menu-details"]');

  await driver.findVisibleElement('.popover-bg');

  // get the public address for the "second account"
  const accountDOM = await driver.waitForSelector('.multichain-address-copy-button');;
  const accountAddress = await accountDOM.getText();

  await driver.clickElement('button[aria-label="Close"]');
  await driver.waitForElementNotPresent('.popover-bg');

  return accountAddress;
}
