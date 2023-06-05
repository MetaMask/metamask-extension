const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('settingsSecurityAndPrivacy-RevealSRP', function () {
  it('completes quiz and reveals SRP text', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate settings to reveal SRP
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });
        await driver.clickElement('[data-testid="reveal-seed-words"]');

        // start quiz
        await driver.clickElement('[data-testid="srp-quiz-get-started"]');

        // tap correct answer 1
        await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

        // tap Continue 1
        await driver.clickElement('[data-testid="srp-quiz-continue"]');

        // tap correct answer 2
        await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

        // tap Continue 2
        await driver.clickElement('[data-testid="srp-quiz-continue"]');

        // enter password
        await driver.fill('#password-box', 'correct horse battery staple');
        await driver.press('#password-box', driver.Key.ENTER);

        // tap and hold to reveal
        await driver.holdMouseDownOnElement(
          'button.hold-to-reveal-button__button-hold',
          2000,
        );

        // confirm SRP text matches expected
        const displayedSRP = await driver.findVisibleElement('.notranslate');
        assert.equal(
          await displayedSRP.getText(),
          'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
        );
        await driver.clickElement({
          text: 'Close',
          tag: 'button',
        });
      },
    );
  });
  it('completes quiz and reveals SRP QR after wrong answers', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // navigate settings to reveal SRP
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });
        await driver.clickElement('[data-testid="reveal-seed-words"]');

        // start quiz
        await driver.clickElement('[data-testid="srp-quiz-get-started"]');

        // tap incorrect answer 1
        await driver.clickElement('[data-testid="srp-quiz-wrong-answer"]');

        //try again
        await driver.clickElement('[data-testid="srp-quiz-try-again"]');

        // tap correct answer 1
        await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

        // tap Continue 1
        await driver.clickElement('[data-testid="srp-quiz-continue"]');

        // tap incorrect answer 2
        await driver.clickElement('[data-testid="srp-quiz-wrong-answer"]');

        //try again
        await driver.clickElement('[data-testid="srp-quiz-try-again"]');

        // tap correct answer 1
        await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

        // tap Continue 2
        await driver.clickElement('[data-testid="srp-quiz-continue"]');

        // enter password
        await driver.fill('#password-box', 'correct horse battery staple');
        await driver.press('#password-box', driver.Key.ENTER);

        // tap and hold to reveal
        await driver.holdMouseDownOnElement(
          'button.hold-to-reveal-button__button-hold',
          2000,
        );

        // confirm SRP QR is displayed
        await driver.clickElement({
          text: 'QR',
          tag: 'button',
        });
        const qrCode = await driver.findElement(
          '.box--padding-top-4 > div:nth-child(1) > table:nth-child(1)',
        );
        assert.equal(await qrCode.isDisplayed(), true);
        await driver.clickElement({
          text: 'Close',
          tag: 'button',
        });
      },
    );
  });
});
