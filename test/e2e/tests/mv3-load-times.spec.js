const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('MV3 - load times in ms', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('should measure the time for loading a new account', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        const loadingTimes = {};
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('.account-menu__icon');
        const timestampBeforeAction = new Date();
        await driver.clickElement({ text: 'Create Account', tag: 'div' });
        await driver.fill('.new-account-create-form input', '2nd account');
        await driver.clickElement({ text: 'Create', tag: 'button' });

        await driver.waitForSelector({
          css: '.currency-display-component__text',
          text: '0',
        });
        const timestampAfterAction = new Date();
        loadingTimes.createAccount =
          timestampAfterAction - timestampBeforeAction;

        console.log(loadingTimes);
        assert.equal(
          Object.prototype.hasOwnProperty.call(loadingTimes, 'createAccount'),
          true,
        );
      },
    );
  });
});
