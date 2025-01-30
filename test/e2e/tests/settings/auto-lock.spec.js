const {
  defaultGanacheOptions,
  openMenuSafe,
  unlockWallet,
  withFixtures,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('Auto-Lock Timer', function () {
  it('should automatically lock the wallet once the idle time has elapsed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        // Set Auto Lock Timer
        await openMenuSafe(driver);
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        const sixSecsInMins = '0.1';
        const autoLockTimerInput = await driver.findElement(
          '[data-testid="advanced-setting-auto-lock"] input',
        );
        await driver.scrollToElement(autoLockTimerInput);
        await autoLockTimerInput.fill(10081);
        await driver.waitForSelector({
          css: '#autoTimeout-helper-text',
          text: 'Lock time must be a number between 0 and 10080',
        });
        await autoLockTimerInput.fill(sixSecsInMins);

        await driver.assertElementNotPresent('#autoTimeout-helper-text', {
          waitAtLeastGuard: 100, // A findElementGuard is not possible here, because only this element changes, but a waitAtLeast of 100ms should be sufficient
        });

        await driver.clickElement(
          '[data-testid="advanced-setting-auto-lock"] button',
        );
        // Verify the wallet is locked
        await driver.waitForSelector({
          css: '[data-testid="unlock-page-title"]',
          text: 'Welcome back!',
        });
        await driver.waitForSelector('.unlock-page button');
      },
    );
  });
});
