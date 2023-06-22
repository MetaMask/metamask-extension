const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  logInWithBalanceValidation,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

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
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, ganacheServer }) => {
        await driver.navigate();
        await logInWithBalanceValidation(driver, ganacheServer);

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

        await driver.waitForSelector({
          css: '.transaction-list-item__primary-currency',
          text: '-2 ETH',
        });
      },
    );
  });
  it('Edit entry in address book', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Contacts', tag: 'div' });
        await driver.clickElement({ text: 'Test Name 1', tag: 'p' });

        await driver.clickElement({ text: 'Edit', tag: 'button' });
        const inputUsername = await driver.findElement('#nickname');
        await inputUsername.fill('Test Name Edit');
        const inputAddress = await driver.findElement('#address');

        await inputAddress.fill('0x74cE91B75935D6Bedc27eE002DeFa566c5946f74');

        await driver.clickElement('[data-testid="page-container-footer-next"]');

        const recipientUsername = await driver.findElement({
          text: 'Test Name Edit',
          tag: 'p',
        });
        assert.equal(
          await recipientUsername.getText(),
          'Test Name Edit',
          'Username is not edited correctly',
        );

        const recipientAddress = await driver.findElement(
          '.send__select-recipient-wrapper__group-item__subtitle',
        );
        assert.equal(
          await recipientAddress.getText(),
          '0x74cE...6f74',
          'Recipient address is not edited correctly',
        );
      },
    );
  });
  it('Deletes existing entry from address book', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAddressBookController({
            addressBook: {
              '0x539': {
                '0x2f318C334780961FB129D2a6c30D0763d9a5C970': {
                  address: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
                  chainId: '0x539',
                  isEns: false,
                  memo: '',
                  name: 'Test Name 1',
                },
              },
            },
          })
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Contacts', tag: 'div' });

        await driver.clickElement({ text: 'Test Name 1', tag: 'p' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await driver.clickElement({ text: 'Delete account', tag: 'a' });
        // it checks if account is deleted
        const contact = await driver.findElement(
          '.send__select-recipient-wrapper__group-item',
        );
        const exists = await driver.isElementPresent(contact);
        assert.equal(exists, false, 'Contact is not deleted');
      },
    );
  });
});
