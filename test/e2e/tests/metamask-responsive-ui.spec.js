const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, tinyDelayMs } = require('../helpers');
const enLocaleMessages = require('../../../app/_locales/en/messages.json');

describe('MetaMask Responsive UI', function () {
  it('Creating a new wallet', async function () {
    const driverOptions = { responsive: true };

    await withFixtures(
      {
        fixtures: 'onboarding',
        driverOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        async function clickWordAndWait(word) {
          await driver.clickElement(
            `[data-testid="seed-phrase-sorted"] [data-testid="draggable-seed-${word}"]`,
          );
          await driver.delay(tinyDelayMs);
        }

        if (process.env.ONBOARDING_V2 === '1') {
          // welcome
          await driver.clickElement('[data-testid="onboarding-create-wallet"]');

          // metrics
          await driver.clickElement('[data-testid="metametrics-no-thanks"]');

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
          await driver.clickElement('[data-testid="create-password-wallet"]');

          // secure wallet
          await driver.clickElement(
            '[data-testid="secure-wallet-recommended"]',
          );

          // review
          await driver.clickElement('[data-testid="recovery-phrase-reveal"]');
          const chipTwo = await (
            await driver.findElement('[data-testid="recovery-phrase-chip-2"]')
          ).getText();
          const chipThree = await (
            await driver.findElement('[data-testid="recovery-phrase-chip-3"]')
          ).getText();
          const chipSeven = await (
            await driver.findElement('[data-testid="recovery-phrase-chip-7"]')
          ).getText();
          await driver.clickElement('[data-testid="recovery-phrase-next"]');

          // confirm
          await driver.fill('[data-testid="recovery-phrase-input-2"]', chipTwo);
          await driver.fill(
            '[data-testid="recovery-phrase-input-3"]',
            chipThree,
          );
          await driver.fill(
            '[data-testid="recovery-phrase-input-7"]',
            chipSeven,
          );
          await driver.clickElement('[data-testid="recovery-phrase-confirm"]');

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
          await driver.delay(tinyDelayMs);

          // clicks the "I Agree" option on the metametrics opt-in screen
          await driver.clickElement('.btn-primary');

          // clicks the "Create New Wallet" option
          await driver.clickElement({ text: 'Create a Wallet', tag: 'button' });

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

          // renders the Secret Recovery Phrase intro screen
          await driver.clickElement('.seed-phrase-intro__left button');

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

          // can retype the Secret Recovery Phrase
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
        }

        // assert balance
        const balance = await driver.findElement(
          '[data-testid="wallet-balance"]',
        );
        assert.ok(/^0\sETH$/u.test(await balance.getText()));
      },
    );
  });

  it('Importing existing wallet from lock page', async function () {
    const driverOptions = { responsive: true };
    const testSeedPhrase =
      'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

    await withFixtures(
      {
        fixtures: 'imported-account',
        driverOptions,
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();

        // Import Secret Recovery Phrase
        const restoreSeedLink = await driver.findClickableElement(
          '.unlock-page__link',
        );
        assert.equal(await restoreSeedLink.getText(), 'Forgot password?');
        await restoreSeedLink.click();

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          testSeedPhrase,
        );

        await driver.fill('#password', 'correct horse battery staple');
        await driver.fill('#confirm-password', 'correct horse battery staple');
        await driver.press('#confirm-password', driver.Key.ENTER);

        // balance renders
        await driver.waitForSelector({
          css: '[data-testid="eth-overview__primary-currency"]',
          text: '1000 ETH',
        });
      },
    );
  });

  it('Send Transaction from responsive window', async function () {
    const driverOptions = { responsive: true };
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: 'imported-account',
        driverOptions,
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Send ETH from inside MetaMask
        // starts to send a transaction
        await driver.clickElement('[data-testid="eth-overview-send"]');

        await driver.fill(
          'input[placeholder="Search, public address (0x), or ENS"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.fill('.unit-input__input', '1');

        const inputValue = await inputAmount.getProperty('value');
        assert.equal(inputValue, '1');

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

        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-1 ETH',
          },
          { timeout: 10000 },
        );
      },
    );
  });
});
