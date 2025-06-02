const { strict: assert } = require('assert');
const { Browser } = require('selenium-webdriver');
const {
  TEST_SEED_PHRASE_TWO,
  locateAccountBalanceDOM,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  withFixtures,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('MetaMask Responsive UI', function () {
  it('Creating a new wallet', async function () {
    const driverOptions = { constrainWindowSize: true };

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        driverOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          // metrics
          await driver.clickElement('[data-testid="metametrics-no-thanks"]');
        }

        // welcome
        await driver.clickElement(
          '[data-testid="onboarding-get-started-button"]',
        );

        // show terms of use
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="terms-of-use-scroll-button"]',
        );
        await driver.clickElement('[data-testid="terms-of-use-checkbox"]');
        // agree to terms of use
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="terms-of-use-agree-button"]',
        );

        // get started
        await driver.clickElement('[data-testid="onboarding-create-wallet"]');
        // create with srp
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="onboarding-create-with-srp-button"]',
        );

        // create password
        await driver.fill(
          '[data-testid="create-password-new-input"]',
          'correct horse battery staple',
        );
        await driver.fill(
          '[data-testid="create-password-confirm-input"]',
          'correct horse battery staple',
        );
        await driver.clickElement('[data-testid="create-password-terms"]');
        await driver.clickElement('[data-testid="create-password-submit"]');

        // secure wallet
        await driver.clickElement('[data-testid="secure-wallet-recommended"]');

        // review
        await driver.clickElement('[data-testid="recovery-phrase-reveal"]');
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="recovery-phrase-continue"]',
        );

        let quizWordsString = '';
        const recoveryPhraseChips = await driver.findElement(
          '[data-testid="recovery-phrase-chips"]',
        );
        quizWordsString = await recoveryPhraseChips.getAttribute(
          'data-quiz-words',
        );

        // confirm SRP
        const quizWords = JSON.parse(quizWordsString).sort(
          (a, b) => a.index - b.index,
        );
        const quizInputSelector0 = `[data-testid="recovery-phrase-quiz-unanswered-${quizWords[0].index}"]`;
        const quizInputSelector1 = `[data-testid="recovery-phrase-quiz-unanswered-${quizWords[1].index}"]`;
        const quizInputSelector2 = `[data-testid="recovery-phrase-quiz-unanswered-${quizWords[2].index}"]`;

        await driver.waitForMultipleSelectors([
          quizInputSelector0,
          quizInputSelector1,
          quizInputSelector2,
        ]);
        await driver.clickElement(quizInputSelector0);
        await driver.clickElement(quizInputSelector1);
        await driver.clickElement(quizInputSelector2);
        await driver.clickElement('[data-testid="recovery-phrase-confirm"]');
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="confirm-srp-modal-button"]',
        );

        if (process.env.SELENIUM_BROWSER !== Browser.FIREFOX) {
          // metrics
          await driver.clickElement('[data-testid="metametrics-no-thanks"]');
        }

        // complete
        await driver.clickElement('[data-testid="onboarding-complete-done"]');

        // pin extension
        await driver.clickElement('[data-testid="pin-extension-done"]');
        await driver.assertElementNotPresent('.loading-overlay__spinner');
        // assert balance
        await driver.waitForSelector({
          css: '[data-testid="eth-overview__primary-currency"]',
          text: '0',
        });
      },
    );
  });

  it('Importing existing wallet from lock page', async function () {
    const driverOptions = { constrainWindowSize: true };

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        driverOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        // Import Secret Recovery Phrase
        await driver.waitForSelector({
          tag: 'p',
          text: 'Localhost 8545',
        });
        await driver.clickElement(
          '[data-testid="unlock-forgot-password-button"]',
        );
        await driver.clickElementAndWaitToDisappear(
          '[data-testid="reset-password-modal-button"]',
        );

        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          TEST_SEED_PHRASE_TWO,
        );

        await driver.fill('#password', 'correct horse battery staple');
        await driver.fill('#confirm-password', 'correct horse battery staple');
        await driver.press('#confirm-password', driver.Key.ENTER);

        // balance renders
        await locateAccountBalanceDOM(driver);
      },
    );
  });

  it('Send Transaction from responsive window', async function () {
    const driverOptions = { constrainWindowSize: true };
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        driverOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await logInWithBalanceValidation(driver);

        // Send ETH from inside MetaMask
        // starts to send a transaction
        await openActionMenuAndStartSendFlow(driver);
        await driver.fill(
          'input[placeholder="Enter public address (0x) or domain name"]',
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );

        const inputAmount = await driver.fill('input[placeholder="0"]', '1');

        const inputValue = await inputAmount.getProperty('value');
        assert.equal(inputValue, '1');
        await driver.clickElement({ text: 'Continue', tag: 'button' });

        // wait for transaction value to be rendered and confirm
        await driver.waitForSelector({
          css: 'h2',
          text: '1 ETH',
        });
        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        // finds the transaction in the transactions list
        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
          text: '-1 ETH',
        });
      },
    );
  });
});
