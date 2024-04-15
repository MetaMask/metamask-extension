const { strict: assert } = require('assert');
const {
  withFixtures,
  passwordUnlockOpenSRPRevealQuiz,
  completeSRPRevealQuiz,
  tapAndHoldToRevealSRP,
  closeSRPReveal,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { tEn } = require('../../lib/i18n-helpers');

describe('Reveal SRP through settings', function () {
  const testPassword = 'correct horse battery staple';
  const wrongTestPassword = 'test test test test';
  const seedPhraseWords =
    'spread raise short crane omit tent fringe mandate neglect detail suspect cradle';

  it('should not reveal SRP text with incorrect password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await passwordUnlockOpenSRPRevealQuiz(driver);
        await completeSRPRevealQuiz(driver);
        await driver.fill('#password-box', wrongTestPassword);
        await driver.press('#password-box', driver.Key.ENTER);
        const passwordErrorIsDisplayed = await driver.isElementPresent({
          css: '.mm-help-text',
          text: 'Incorrect password',
        });
        assert.equal(passwordErrorIsDisplayed, true);
      },
    );
  });

  it('completes quiz and reveals SRP text', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await passwordUnlockOpenSRPRevealQuiz(driver);
        await completeSRPRevealQuiz(driver);

        // enter password
        await driver.fill('#password-box', testPassword);
        await driver.press('#password-box', driver.Key.ENTER);

        await tapAndHoldToRevealSRP(driver);

        // confirm SRP text matches expected
        const displayedSRP = await driver.findVisibleElement(
          '[data-testid="srp_text"]',
        );
        assert.equal(await displayedSRP.getText(), seedPhraseWords);

        // copy SRP text to clipboard
        await driver.clickElement({
          text: tEn('copyToClipboard'),
          tag: 'button',
        });
        await driver.findVisibleElement({
          text: tEn('copiedExclamation'),
          tag: 'button',
        });

        // confirm that CTA returns user to wallet view
        await closeSRPReveal(driver);
      },
    );
  });

  it('completes quiz and reveals SRP QR after wrong answers', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await passwordUnlockOpenSRPRevealQuiz(driver);

        // start quiz
        await driver.clickElement('[data-testid="srp-quiz-get-started"]');

        // tap incorrect answer 1
        await driver.clickElement('[data-testid="srp-quiz-wrong-answer"]');

        // try again
        await driver.clickElement('[data-testid="srp-quiz-try-again"]');

        // tap correct answer 1
        await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

        // tap Continue 1
        await driver.clickElement('[data-testid="srp-quiz-continue"]');

        // tap incorrect answer 2
        await driver.clickElement('[data-testid="srp-quiz-wrong-answer"]');

        // try again
        await driver.clickElement('[data-testid="srp-quiz-try-again"]');

        // tap correct answer 1
        await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

        // tap Continue 2
        await driver.clickElement('[data-testid="srp-quiz-continue"]');

        // enter password
        await driver.fill('#password-box', testPassword);
        await driver.press('#password-box', driver.Key.ENTER);

        // tap and hold to reveal
        await tapAndHoldToRevealSRP(driver);

        // confirm SRP QR is displayed
        await driver.clickElement({
          text: 'QR',
          tag: 'button',
        });
        const qrCode = await driver.findElement('[data-testid="qr-srp"]');
        assert.equal(await qrCode.isDisplayed(), true);

        // confirm that CTA returns user to wallet view
        await closeSRPReveal(driver);
      },
    );
  });
});
