const { strict: assert } = require('assert');
const { Browser } = require('selenium-webdriver');
const {
  getGlobalProperties,
  testIntrinsic,
} = require('../../helpers/protect-intrinsics-helpers');
const { convertToHexValue, withFixtures } = require('../helpers');
const { PAGES } = require('../webdriver/driver');
const FixtureBuilder = require('../fixture-builder');

const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;

/**
 * This script iterates over all named intrinsics and tests that they are locked
 * down per ses/lockdown.
 *
 * We set globalThis to window in Firefox because the test fails otherwise.
 * We believe this is due to some Selenium-related shenanigans. In the browser,
 * this behavior is not a problem.
 */
const lockdownTestScript = `
${isFirefox ? 'globalThis = window;' : ''}

const assert = {
  equal: (value, comparison, message) => {
    if (value !== comparison) {
      throw new Error(message || 'not equal');
    }
  },
  ok: (value, message) => {
    if (!value) {
      throw new Error(message || 'not ok');
    }
  },
};

${getGlobalProperties.toString()}

${testIntrinsic.toString()}

try {
  getGlobalProperties().forEach((propertyName) => {
    console.log('Testing intrinsic:', propertyName);
    testIntrinsic(propertyName);
  })
  console.log('Lockdown test successful!');
  return true;
} catch (error) {
  console.log('Lockdown test failed.', error);
  return false;
}
`;

describe('lockdown', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('the UI and background environments are locked down', async function () {
    await withFixtures(
      {
        // The fixtures used here is arbitrary. Any fixture would do.
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.HOME);
        assert.equal(
          await driver.executeScript(lockdownTestScript),
          true,
          'The UI environment should be locked down.',
        );

        await driver.navigate(PAGES.BACKGROUND);
        assert.equal(
          await driver.executeScript(lockdownTestScript),
          true,
          'The background environment should be locked down.',
        );
      },
    );
  });
});
