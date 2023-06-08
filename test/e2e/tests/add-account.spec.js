const { strict: assert } = require('assert');
const {
  TEST_SEED_PHRASE,
  withFixtures,
  completeImportSRPOnboardingFlow,
  sendTransaction,
  findAnotherAccountFromAccountList,
  waitForAccountRendered,
  convertToHexValue,
  regularDelayMs,
} = require('../helpers');

const FixtureBuilder = require('../fixture-builder');
const { shortenAddress } = require('../../../ui/helpers/utils/util');

describe('Add account', function () {
  const testPassword = 'correct horse battery staple';
  const firstAccount = '0x0Cc5261AB8cE458dc977078A3623E2BaDD27afD3';
  const secondAccount = '0x3ED0eE22E0685Ebbf07b2360A8331693c413CC59';

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
          TEST_SEED_PHRASE,
          testPassword,
        );

        // Check address of 1st account
        await waitForAccountRendered(driver);
        const firstAccountPublicAddress = await retrieveShortenAccountAddress(
          driver,
        );
        assert.equal(firstAccountPublicAddress, shortenAddress(firstAccount));

        // Create 2nd account
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });
        await waitForAccountRendered(driver);

        // Check address of 2nd account
        const secondAccountPublicAddress = await retrieveShortenAccountAddress(
          driver,
        );
        assert.strictEqual(
          secondAccountPublicAddress,
          shortenAddress(secondAccount),
        );

        // Log into the account with balance(account 1)
        // and transfer some balance to 2nd account
        // so they will not be removed after recovering SRP
        const accountOneSelector = await findAnotherAccountFromAccountList(
          driver,
          1,
          'Account 1',
        );
        await waitForAccountRendered(driver);
        await driver.clickElement(accountOneSelector);
        await sendTransaction(driver, secondAccount, '2.8');

        // Lock the account
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.delay(regularDelayMs);
        await driver.waitForSelector('[data-testid="global-menu-lock"]');
        await driver.clickElement('[data-testid="global-menu-lock"]');
        await driver.waitForSelector('[data-testid="unlock-page"]');

        // Recover via SRP in "forget password" option
        const restoreSeedLink = await driver.findClickableElement(
          '.unlock-page__link',
        );
        await restoreSeedLink.click();
        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          TEST_SEED_PHRASE,
        );
        await driver.fill('#password', 'correct horse battery staple');
        await driver.fill('#confirm-password', 'correct horse battery staple');

        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="create-new-vault-submit-button"]',
        );

        // Land in 1st account home page
        await driver.findElement('.home__main-view');
        await waitForAccountRendered(driver);

        // Check address of 1st account
        const restoredFirstAccountPublicAddress =
          await retrieveShortenAccountAddress(driver);
        assert.equal(
          restoredFirstAccountPublicAddress,
          shortenAddress(firstAccount),
        );

        // Check address of 2nd account
        const accountTwoSelector = await findAnotherAccountFromAccountList(
          driver,
          2,
          'Account 2',
        );
        await driver.clickElement(accountTwoSelector);

        const restoredSecondAccountPublicAddress =
          await retrieveShortenAccountAddress(driver);
        assert.equal(
          restoredSecondAccountPublicAddress,
          shortenAddress(secondAccount),
        );
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

        await waitForAccountRendered(driver);

        await driver.clickElement('[data-testid="account-menu-icon"]');

        await driver.clickElement(
          '[data-testid="multichain-account-menu-add-account"]',
        );

        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        // Wait for 2nd account to be created
        await waitForAccountRendered(driver);
        const secondAccountCreated = await driver.findElement(
          '[data-testid="account-menu-icon"]',
        );
        assert.equal(await secondAccountCreated.getText(), '2nd account');

        await driver.clickElement('[data-testid="account-menu-icon"]');

        const menuItems = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(menuItems.length, 2);

        // User cannot delete 2nd account generated from the SRP imported in onboarding
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.waitForElementNotPresent(
          '[data-testid="account-list-menu-remove"]',
        );

        // Create 3rd account with private key
        await driver.clickElement('.menu__background');
        await driver.clickElement({ text: 'Import account', tag: 'button' });
        await driver.fill('#private-key-box', testPrivateKey);
        await driver.clickElement({ text: 'Import', tag: 'button' });

        // Wait for 3rd account to be created
        await waitForAccountRendered(driver);
        const thirdAccountCreated = await driver.findElement(
          '[data-testid="account-menu-icon"]',
        );
        assert.equal(await thirdAccountCreated.getText(), 'Account 3');

        // User can delete 3rd account imported with a private key
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const importedMenuItems = await driver.findElements(
          '.multichain-account-list-item',
        );
        assert.equal(importedMenuItems.length, 3);
        await driver.clickElement(
          '.multichain-account-list-item--selected [data-testid="account-list-item-menu-button"]',
        );
        await driver.findElement('[data-testid="account-list-menu-remove"]');
      },
    );
  });
});

async function retrieveShortenAccountAddress(driver) {
  // get the shorten public address for account
  const accountDOM = await driver.waitForSelector(
    '.multichain-address-copy-button',
  );
  return await accountDOM.getText();
}
