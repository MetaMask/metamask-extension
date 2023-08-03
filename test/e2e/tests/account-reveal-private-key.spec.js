const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  revealPrivateKey,
  tapAndHoldToRevealPrivateKey,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { tEn } = require('../../lib/i18n-helpers');

describe('Reveal private key from account details', function () {
  const testPassword = 'correct horse battery staple';
  const wrongTestPassword = 'test test test test';
  const pkString =
    '7c9529a67102755b7e6102d6d950ac5d5863c98713805cec576b945b15b71eac';

  it('incorrect password does not reveal private key', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.title,
        failOnConsoleError: false,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await revealPrivateKey(driver);
        await driver.fill('#account-details-authenticate', wrongTestPassword);
        await driver.press('#account-details-authenticate', driver.Key.ENTER);

        // display error when password is incorrect
        const passwordErrorIsDisplayed = await driver.isElementPresent({
          css: '.mm-help-text',
          text: 'Incorrect Password.',
        });
        assert.equal(passwordErrorIsDisplayed, true);
      },
    );
  });

  it('reveals private key with click and hold', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await unlockWallet(driver);
        await revealPrivateKey(driver);
        await driver.fill('#account-details-authenticate', testPassword);
        await driver.press('#account-details-authenticate', driver.Key.ENTER);
        await tapAndHoldToRevealPrivateKey(driver);

        // confirm private key is displayed and matches expected
        const displayedPrivateKey = await driver.findVisibleElement(
          '[data-testid="account-details-key"]',
        );
        assert.equal(await displayedPrivateKey.getText(), pkString);

        // click done
        await driver.clickElement({
          text: tEn('done'),
          tag: 'button',
        });

        // confirm that user is returned to wallet view
        await driver.findVisibleElement({
          text: tEn('tokens'),
          tag: 'button',
        });
      },
    );
  });
});
