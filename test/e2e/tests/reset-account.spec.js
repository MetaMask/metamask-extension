const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Reset account', function () {
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// When user get stuck with pending transactions, one can reset the account by clicking the 'Reset account' //
// button in settings, advanced tab. This functionality will clear all the send transactions history.       //
// Note that the receive transactions history will be kept and it only only affects the current network.    //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
          fixtures: new FixtureBuilder().build(),
          ganacheOptions,
          title: this.test.title,
        },
        async ({ driver }) => {
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          // Send ether
          await driver.clickElement('[data-testid="eth-overview-send"]');
          await driver.fill(
            'input[placeholder="Search, public address (0x), or ENS"]',
            '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
          );
          await driver.fill('.unit-input__input', '1');
          await driver.clickElement({ text: 'Next', tag: 'button' });
          await driver.clickElement({ text: 'Confirm', tag: 'button' });

          await driver.wait(async () => {
            const confirmedTxes = await driver.findElements(
              '.transaction-list__completed-transactions .transaction-list-item',
            );
            return confirmedTxes.length === 1;
          }, 10000);

          // Reset account
          await driver.clickElement('.account-menu__icon');
          await driver.clickElement({ text: 'Settings', tag: 'div' });
          await driver.clickElement({ css: '.tab-bar__tab__content__title', text: 'Advanced' });
          await driver.clickElement({ text: 'Reset account', tag: 'button' });
          await driver.clickElement({ text: 'Reset', tag: 'button' });
          await driver.clickElement('.settings-page__header__title-container__close-button');

          // Check send transaction history should been cleared
          const sendTransaction = await driver.isElementPresent(
            { css: '.list-item__title', text: 'Send' }
          );
          assert.equal(sendTransaction, false);
        },
      );
    });
  });
  