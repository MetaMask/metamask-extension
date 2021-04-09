const { strict: assert } = require('assert');
const { until } = require('selenium-webdriver');
const { withFixtures, tinyDelayMs } = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');

describe('Metamask Responsive UI', function () {
  it('Onboarding and send flow with responsive UI', async function () {
    const driverOptions = { responsive: true };
    const testSeedPhrase =
      'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

    await withFixtures(
      { fixtures: 'onboarding', driverOptions, title: this.test.title },
      async ({ driver }) => {
        await driver.navigate();

        // clicks the continue button on the welcome screen
        await driver.findElement('.welcome-page__header');
        await driver.clickElement({
          text: enLocaleMessages.getStarted.message,
          tag: 'button',
        });
        await driver.delay(tinyDelayMs);

        // clicks the "Create New Wallet" option
        await driver.clickElement({ text: 'Create a Wallet', tag: 'button' });

        // clicks the "I Agree" option on the metametrics opt-in screen
        await driver.clickElement('.btn-primary');

        // accepts a secure password
        const passwordBox = await driver.findElement(
          '.first-time-flow__form #create-password',
        );
        const passwordBoxConfirm = await driver.findElement(
          '.first-time-flow__form #confirm-password',
        );

        await passwordBox.sendKeys('correct horse battery staple');
        await passwordBoxConfirm.sendKeys('correct horse battery staple');

        await driver.clickElement('.first-time-flow__checkbox');

        await driver.clickElement('.first-time-flow__form button');

        // reveals the seed phrase
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

        async function clickWordAndWait(word) {
          await driver.clickElement(
            `[data-testid="seed-phrase-sorted"] [data-testid="draggable-seed-${word}"]`,
          );
          await driver.delay(tinyDelayMs);
        }

        // can retype the seed phrase
        const words = seedPhrase.split(' ');

        for (const word of words) {
          await clickWordAndWait(word);
        }

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // clicks through the success screen
        await driver.findElement({ text: 'Congratulations', tag: 'div' });
        await driver.clickElement({
          text: enLocaleMessages.endOfFlowMessage10.message,
          tag: 'button',
        });

        // Show account information
        // show account details dropdown menu
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        const options = await driver.findElements(
          '.account-options-menu .menu-item',
        );
        assert.equal(options.length, 3); // HD Wallet type does not have to show the Remove Account option
        // click outside of menu to dismiss
        // account menu button chosen because the menu never covers it.
        await driver.clickPoint('.account-menu__icon', 0, 0);

        // logs out of the vault
        await driver.clickElement('.account-menu__icon');

        const lockButton = await driver.findClickableElement(
          '.account-menu__lock-button',
        );
        assert.equal(await lockButton.getText(), 'Lock');
        await lockButton.click();
        await driver.delay(tinyDelayMs);

        // Import seed phrase
        const restoreSeedLink = await driver.findClickableElement(
          '.unlock-page__link--import',
        );
        assert.equal(
          await restoreSeedLink.getText(),
          'Import using account seed phrase',
        );
        await restoreSeedLink.click();

        await driver.clickElement('.import-account__checkbox-container');

        const seedTextArea = await driver.findElement('textarea');
        await seedTextArea.sendKeys(testSeedPhrase);

        const passwordInputs = await driver.findElements('input');
        await passwordInputs[0].sendKeys('correct horse battery staple');
        await passwordInputs[1].sendKeys('correct horse battery staple');
        await driver.clickElement({
          text: enLocaleMessages.restore.message,
          tag: 'button',
        });

        // switches to localhost
        await driver.clickElement('.network-display');
        await driver.clickElement({
          xpath: `//span[contains(@class, 'network-name-item') and contains(text(), 'Localhost 8545')]`,
        });
        // await driver.delay(largeDelayMs * 2);

        // balance renders
        const balance = await driver.findElement(
          '[data-testid="eth-overview__primary-currency"]',
        );
        await driver.wait(until.elementTextMatches(balance, /100\s*ETH/u));

        // Send ETH from inside MetaMask
        // starts to send a transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');

        const inputAddress = await driver.findElement(
          'input[placeholder="Search, public address (0x), or ENS"]',
        );
        await inputAddress.sendKeys(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.findElement('.unit-input__input');
        await inputAmount.sendKeys('1');

        const inputValue = await inputAmount.getAttribute('value');
        assert.equal(inputValue, '1');

        // opens and closes the gas modal
        await driver.clickElement('.advanced-gas-options-btn');
        const gasModal = await driver.findElement('span .modal');
        await driver.clickElement('.page-container__header-close-text');
        await driver.wait(until.stalenessOf(gasModal), 10000);

        // confirming transcation
        await driver.clickElement({ text: 'Next', tag: 'button' });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // finds the transaction in the transactions list
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        const txValues = await driver.findElement(
          '.transaction-list-item__primary-currency',
        );
        await driver.wait(
          until.elementTextMatches(txValues, /-1\s*ETH/u),
          10000,
        );
      },
    );
  });
});
