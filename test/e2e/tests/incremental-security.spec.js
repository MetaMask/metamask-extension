const { strict: assert } = require('assert');
const { withFixtures, tinyDelayMs } = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');

describe('Incremental Security', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x250F458997A364988956409A164BA4E16F0F99F916ACDD73ADCD3A1DE30CF8D1',
        balance: 0,
      },
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: 25000000000000000000,
      },
    ],
  };
  it('Back up Secret Recovery Phrase from backup reminder', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: 'onboarding',
        ganacheOptions,
        title: this.test.title,
        failOnConsoleError: false,
        dappPath: 'send-eth-with-private-key-test',
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.delay(tinyDelayMs);

        // clicks the continue button on the welcome screen
        await driver.findElement('.welcome-page__header');
        await driver.clickElement({
          text: enLocaleMessages.getStarted.message,
          tag: 'button',
        });

        // clicks the "Create New Wallet" option
        await driver.clickElement({ text: 'Create a Wallet', tag: 'button' });

        // clicks the "No thanks" option on the metametrics opt-in screen
        await driver.clickElement('.btn-default');

        // accepts a secure password
        await driver.fill(
          '.first-time-flow__form #create-password',
          'correct horse battery staple',
        );
        await driver.fill(
          '.first-time-flow__form #confirm-password',
          'correct horse battery staple',
        );
        await driver.clickElement('.first-time-flow__checkbox');
        await driver.clickElement('.first-time-flow__form button');

        // renders the Secret Recovery Phrase intro screen'
        await driver.clickElement('.seed-phrase-intro__left button');

        // skips the Secret Recovery Phrase challenge
        await driver.clickElement({
          text: enLocaleMessages.remindMeLater.message,
          tag: 'button',
        });

        // closes the what's new popup
        const popover = await driver.findElement('.popover-container');

        await driver.clickElement('[data-testid="popover-close"]');

        await popover.waitForElementState('hidden');

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu__account-details"]',
        );

        // gets the current accounts address
        const addressInput = await driver.findElement('.readonly-input__input');
        const publicAddress = await addressInput.getAttribute('value');

        // wait for account modal to be visible
        const accountModal = await driver.findVisibleElement('span .modal');

        await driver.clickElement('.account-modal__close');

        // wait for account modal to be removed from DOM
        await accountModal.waitForElementState('hidden');

        // send to current account from dapp with different provider
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];

        // switched to Dapp
        await driver.openNewPage('http://127.0.0.1:8080/');

        // sends eth to the current account
        await driver.fill('#address', publicAddress);
        await driver.clickElement('#send');

        await driver.waitForSelector(
          { css: '#success', text: 'Success' },
          { timeout: 15000 },
        );

        // switch to extension
        await driver.switchToWindow(extension);

        // should have the correct amount of eth
        let currencyDisplay = await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '1',
        });
        let balance = await currencyDisplay.getText();
        assert.strictEqual(balance, '1');

        // backs up the Secret Recovery Phrase
        // should show a backup reminder
        const backupReminder = await driver.findElements({
          xpath:
            "//div[contains(@class, 'home-notification__text') and contains(text(), 'Backup your Secret Recovery Phrase to keep your wallet and funds secure')]",
        });
        assert.equal(backupReminder.length, 1);

        // should take the user to the seedphrase backup screen
        await driver.clickElement('.home-notification__accept-button');

        // reveals the Secret Recovery Phrase
        await driver.clickElement(
          '.reveal-seed-phrase__secret-blocker .reveal-seed-phrase__reveal-button',
        );

        const revealedSeedPhrase = await driver.findElement(
          '.reveal-seed-phrase__secret-words',
        );
        const seedPhrase = await revealedSeedPhrase.getText();
        assert.equal(seedPhrase.split(' ').length, 12);

        await driver.clickElement({
          text: enLocaleMessages.next.message,
          tag: 'button',
        });

        // selecting the words from seedphrase
        async function clickWordAndWait(word) {
          await driver.clickElement(
            `[data-testid="seed-phrase-sorted"] [data-testid="draggable-seed-${word}"]`,
          );
          await driver.delay(tinyDelayMs);
        }

        // can retype the Secret Recovery Phrase
        const words = seedPhrase.split(' ');

        for (const word of words) {
          await clickWordAndWait(word);
        }

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // can click through the success screen
        await driver.clickElement({ text: 'All Done', tag: 'button' });

        // should have the correct amount of eth
        currencyDisplay = await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '1',
        });
        balance = await currencyDisplay.getText();

        assert.strictEqual(balance, '1');

        // should not show a backup reminder
        await driver.assertElementNotPresent('.backup-notification');
      },
    );
  });
});
