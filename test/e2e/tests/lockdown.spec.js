const { strict: assert } = require('assert');
const {
  getGlobalProperties,
  testIntrinsic,
} = require('../../helpers/protect-intrinsics-helpers');
const { withFixtures } = require('../helpers');
const { PAGES } = require('../webdriver/driver');

// This iterates over all named intrinsics and tests that they are locked down
// per ses/lockdown.
const lockdownTestScript = `
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
    testIntrinsic(propertyName);
  })
  return true;
} catch (error) {
  return false;
}
`;

// The fixtures used in these tests are arbitrary. Any fixtures would do.
describe('lockdown', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };

  it('the UI environment is locked down', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const success = await driver.executeScript(lockdownTestScript);

        assert.equal(success, true, 'The environment should be locked down.');
      },
    );
  });

  it('the background environment is locked down', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate(PAGES.background);
        const success = await driver.executeScript(lockdownTestScript);

        assert.equal(success, true, 'The environment should be locked down.');
      },
    );
  });
});
