const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Terms of use', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('accepts the updated terms of use @no-mmi', async function () {
    const firstOfJan = 1672574400;
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            termsOfUseLastAgreed: firstOfJan,
          })
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // accept updated terms of use
        const acceptTerms = '[data-testid="terms-of-use-accept-button"]';
        await driver.clickElement('[data-testid="popover-scroll-button"]');
        await driver.clickElement('[data-testid="terms-of-use-checkbox"]');
        await driver.clickElement(acceptTerms);

        // check modal is no longer shown
        await driver.waitForElementNotPresent(acceptTerms);
        const termsExists = await driver.isElementPresent(acceptTerms);
        assert.equal(termsExists, false, 'terms of use should not be shown');
      },
    );
  });
});
