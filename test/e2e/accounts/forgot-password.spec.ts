import { Suite } from 'mocha';
import { unlockWallet, withFixtures, TEST_SEED_PHRASE_TWO } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';

const newPassword = 'this is the best password ever';

describe('Forgot password', function (this: Suite) {
  it('resets password and then unlock wallet with new password', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // Lock Wallet
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({
          text: 'Lock MetaMask',
          tag: 'div',
        });

        // Go to reset password page
        await driver.waitForSelector('.unlock-page__link');
        await driver.clickElement({
          text: 'Forgot password?',
          tag: 'a',
        });

        // Reset password with a new password
        await driver.pasteIntoField(
          '[data-testid="import-srp__srp-word-0"]',
          TEST_SEED_PHRASE_TWO,
        );

        await driver.fill('#password', newPassword);
        await driver.fill('#confirm-password', newPassword);
        await driver.press('#confirm-password', driver.Key.ENTER);

        // Lock wallet again
        await driver.waitForSelector(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({
          text: 'Lock MetaMask',
          tag: 'div',
        });

        // log in with new password
        await driver.fill('#password', newPassword);
        await driver.press('#password', driver.Key.ENTER);
      },
    );
  });
});
