const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Clear account activity', function () {
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // When user get stuck with pending transactions, one can reset the account by clicking the 'Clear activity tab data' //
  // button in settings, advanced tab. This functionality will clear all the send transactions history.                 //
  // Note that the receive transactions history will be kept and it only only affects the current network.              //
  // /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  it('User can clear account activity via the advanced setting tab, ', async function () {
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
          .withTransactionControllerCompletedAndIncomingTransaction()
          .build(),
        ganacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Check send transaction and receive transaction history are all displayed
        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.waitForSelector({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Send',
        });
        await driver.waitForSelector({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Receive',
        });

        // Clear activity and nonce data
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Advanced', tag: 'div' });
        await driver.clickElement({
          text: 'Clear activity tab data',
          tag: 'button',
        });
        await driver.clickElement({ text: 'Clear', tag: 'button' });
        await driver.navigate();

        // Check send transaction history is cleared and receive transaction history is kept
        const sendTransaction = await driver.isElementPresent({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Send',
        });
        const receiveTransaction = await driver.isElementPresent({
          css: '[data-testid="activity-list-item-action"]',
          text: 'Receive',
        });
        assert.equal(sendTransaction, false);
        assert.equal(receiveTransaction, true);
      },
    );
  });
});
