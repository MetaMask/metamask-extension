const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  unlockWallet,
} = require('../../helpers');
const { shortenAddress } = require('../../../../ui/helpers/utils/util');
const FixtureBuilder = require('../../fixture-builder');

describe('Address Book', function () {
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await openActionMenuAndStartSendFlow(driver);

        await driver.clickElement({ css: 'button', text: 'Contacts' });

        const recipientTitle = await driver.findElement(
          '.address-list-item__label',
        );

        const recipientRowTitleString = await recipientTitle.getText();
        assert.equal(recipientRowTitleString, 'Test Name 1');
        await driver.clickElement('.address-list-item__label');

        await driver.fill('input[placeholder="0"]', '2');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement('[data-testid="home__activity-tab"]');
        await driver.wait(async () => {
          const confirmedTxes = await driver.findElements(
            '.transaction-list__completed-transactions .activity-list-item',
          );
          return confirmedTxes.length === 1;
        }, 10000);

        await driver.waitForSelector({
          css: '[data-testid="transaction-list-item-primary-currency"]',
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Contacts', tag: 'div' });
        await driver.clickElement({
          text: 'Test Name 1',
          css: '.address-list-item__label',
        });

        await driver.clickElement({ text: 'Edit', tag: 'button' });
        const inputUsername = await driver.findElement('#nickname');
        await inputUsername.fill('Test Name Edit');
        const inputAddress = await driver.findElement('#address');

        await inputAddress.fill('0x74cE91B75935D6Bedc27eE002DeFa566c5946f74');

        await driver.clickElement('[data-testid="page-container-footer-next"]');

        const recipientUsername = await driver.findElement({
          text: 'Test Name Edit',
          css: '.address-list-item__label',
        });

        assert.equal(
          await recipientUsername.getText(),
          'Test Name Edit',
          'Username is not edited correctly',
        );

        const recipientAddress = await driver.findElement(
          '[data-testid="address-list-item-address"]',
        );
        assert.equal(
          await recipientAddress.getText(),
          shortenAddress('0x74cE91B75935D6Bedc27eE002DeFa566c5946f74'),
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
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Contacts', tag: 'div' });

        await driver.clickElement({ text: '0x2f318...5C970', tag: 'div' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await driver.clickElement({ text: 'Delete contact', tag: 'a' });

        const contact = await driver.findElement('.address-list-item__label');

        // it checks if account is deleted
        const exists = await driver.isElementPresent(contact);
        assert.equal(exists, false, 'Contact is not deleted');
      },
    );
  });
});
