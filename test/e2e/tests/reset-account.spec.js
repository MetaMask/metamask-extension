const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Reset account', function () {
  // ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // When user get stuck with pending transactions, one can reset the account by clicking the 'Reset account' //
  // button in settings, advanced tab. This functionality will clear all the send transactions history.       //
  // Note that the receive transactions history will be kept and it only only affects the current network.    //
  // ///////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('User can reset account via the advanced setting tab, ', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
        },
      ],
    };
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTransactionControllerCompletedTransaction()
          .withIncomingTransactionsControllerOneTransaction()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Check send transaction and receive transaction history are all displayed
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector(
          { css: '.list-item__title', text: 'Send' },
          { timeout: 10000 },
        );
        await driver.waitForSelector(
          { css: '.list-item__title', text: 'Receive' },
          { timeout: 10000 },
        );

        // Reset account
        await driver.clickElement('.account-menu__icon');
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({
          css: '.tab-bar__tab__content__title',
          text: 'Advanced',
        });
        await driver.clickElement({ text: 'Reset account', tag: 'button' });
        await driver.clickElement({ text: 'Reset', tag: 'button' });
        await driver.navigate();

        // Check send transaction history is cleared and receive transaction history is kept
        const sendTransaction = await driver.isElementPresent({
          css: '.list-item__title',
          text: 'Send',
        });
        const receiveTransaction = await driver.isElementPresent({
          css: '.list-item__title',
          text: 'Receive',
        });
        assert.equal(sendTransaction, false);
        assert.equal(receiveTransaction, true);
      },
    );
  });
});
