const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Auto-Lock Timer', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('should automatically lock the wallet once the idle time has elapsed', async function () {
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
        // Set Auto Lock Timer
        await driver.clickElement('.account-menu__icon');
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
          text: 'Lock time is too great',
        });
        await autoLockTimerInput.fill(sixSecsInMins);
        await driver.assertElementNotPresent('#autoTimeout-helper-text');
        await driver.clickElement(
          '[data-testid="advanced-setting-auto-lock"] button',
        );
        // Verify the wallet is loccked
        const pageTitle = await driver.findElement('.unlock-page__title');
        const unlockButton = await driver.findElement('.unlock-page button');
        assert.equal(await pageTitle.getText(), 'Welcome Back!');
        assert.equal(await unlockButton.isDisplayed(), true);
      },
    );
  });
});
