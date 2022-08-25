const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures } = require('../helpers');

describe('Address Book', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };
  it('Sends to an address book entry', async function () {
    await withFixtures(
      {
        fixtures: 'address-entry',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement('[data-testid="eth-overview-send"]');
        const recipientRowTitle = await driver.findElement(
          '.send__select-recipient-wrapper__group-item__title',
        );
        const recipientRowTitleString = await recipientRowTitle.getText();
        assert.equal(recipientRowTitleString, 'Test Name 1');
        await driver.clickElement(
          '.send__select-recipient-wrapper__group-item',
        );

        await driver.fill('.unit-input__input', '2');

        await driver.clickElement({ text: 'Next', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .transaction-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector(
          {
            css: '.transaction-list-item__primary-currency',
            text: '-2 ETH',
          },
          { timeout: 10000 },
        );
      },
    );
  });
});
