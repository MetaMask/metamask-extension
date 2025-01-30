const { strict: assert } = require('assert');
const { By } = require('selenium-webdriver');
const {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
  openActionMenuAndStartSendFlow,
  openMenuSafe,
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

        await driver.waitForSelector({
          css: '.address-list-item__label',
          text: 'Test Name 1',
        });

        await driver.clickElement('.address-list-item__label');

        await driver.fill('input[placeholder="0"]', '2');

        await driver.clickElement({ text: 'Continue', tag: 'button' });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });

        await driver.clickElement(
          '[data-testid="account-overview__activity-tab"]',
        );
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

  it('Adds a new contact to the address book', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Contacts', tag: 'div' });

        await driver.clickElement('.address-book__link');

        await driver.fill('#nickname', 'Test User');

        await driver.fill(
          '[data-testid="ens-input"]',
          '0x56A355d3427bC2B1E22c78197AF091230919Cc2A',
        );

        await driver.clickElement('[data-testid="page-container-footer-next"]');

        await driver.waitForSelector({
          text: 'Test User',
          css: '.address-list-item__label',
        });
        await driver.waitForSelector({
          css: '[data-testid="address-list-item-address"]',
          text: '0x56A35...9Cc2A',
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
        await openMenuSafe(driver);

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

        await driver.waitForSelector({
          text: 'Test Name Edit',
          css: '.address-list-item__label',
        });

        await driver.waitForSelector({
          css: '[data-testid="address-list-item-address"]',
          text: shortenAddress('0x74cE91B75935D6Bedc27eE002DeFa566c5946f74'),
        });
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

        await openMenuSafe(driver);

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Contacts', tag: 'div' });

        await driver.clickElement({ text: '0x2f318...5C970', tag: 'div' });
        await driver.clickElement({ text: 'Edit', tag: 'button' });
        await driver.clickElement('.settings-page__address-book-button');

        // it checks if account is deleted
        const exists = await driver.isElementPresent(
          By.css('.address-list-item__label'),
        );
        assert.equal(exists, false, 'Contact is not deleted');
      },
    );
  });
});
