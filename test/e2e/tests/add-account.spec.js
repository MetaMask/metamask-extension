const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
} = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');

describe('Add account', function () {
  const testSeedPhrase =
    'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';
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

  it('should add the same account addresses if added and then the same mnemonic is imported', async function () {
    await withFixtures(
      {
        fixtures: 'onboarding',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        if (process.env.ONBOARDING_V2 === '1') {
          // welcome
          await driver.clickElement('[data-testid="onboarding-import-wallet"]');

          // metrics
          await driver.clickElement('[data-testid="metametrics-no-thanks"]');

          // import with recovery phrase
          await driver.fill('[data-testid="import-srp-text"]', testSeedPhrase);
          await driver.clickElement('[data-testid="import-srp-confirm"]');

          // create password
          await driver.fill(
            '[data-testid="create-password-new"]',
            'correct horse battery staple',
          );
          await driver.fill(
            '[data-testid="create-password-confirm"]',
            'correct horse battery staple',
          );
          await driver.clickElement('[data-testid="create-password-terms"]');
          await driver.clickElement('[data-testid="create-password-import"]');

          // complete
          await driver.clickElement('[data-testid="onboarding-complete-done"]');

          // pin extension
          await driver.clickElement('[data-testid="pin-extension-next"]');
          await driver.clickElement('[data-testid="pin-extension-done"]');
        } else {
          // clicks the continue button on the welcome screen
          await driver.findElement('.welcome-page__header');
          await driver.clickElement({
            text: enLocaleMessages.getStarted.message,
            tag: 'button',
          });

          // clicks the "Import Wallet" option
          await driver.clickElement({ text: 'Import wallet', tag: 'button' });

          // clicks the "No thanks" option on the metametrics opt-in screen
          await driver.clickElement('.btn-secondary');

          // Import Secret Recovery Phrase
          await driver.fill(
            'input[placeholder="Enter your Secret Recovery Phrase"]',
            testSeedPhrase,
          );

          await driver.fill('#password', 'correct horse battery staple');
          await driver.fill(
            '#confirm-password',
            'correct horse battery staple',
          );

          await driver.clickElement(
            '[data-testid="create-new-vault__terms-checkbox"]',
          );

          await driver.clickElement({ text: 'Import', tag: 'button' });

          // clicks through the success screen
          await driver.findElement({ text: 'Congratulations', tag: 'div' });
          await driver.clickElement({
            text: enLocaleMessages.endOfFlowMessage10.message,
            tag: 'button',
          });
        }

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
          '.unlock-page__link--import',
        );

        await restoreSeedLink.click();
        await driver.delay(regularDelayMs);

        await driver.fill(
          'input[placeholder="Enter your Secret Recovery Phrase"]',
          testSeedPhrase,
        );
        await driver.delay(regularDelayMs);

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
});
