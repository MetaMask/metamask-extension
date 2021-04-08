const { By, Key } = require('selenium-webdriver');
const { withFixtures, largeDelayMs } = require('../helpers');
const ThreeboxMockServer = require('../mock-3box/threebox-mock-server');

describe('Threebox', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: 25000000000000000000,
      },
    ],
  };
  let threeboxServer;
  before(async function () {
    threeboxServer = new ThreeboxMockServer();
    console.log('in before: ', threeboxServer.database);
    await threeboxServer.start();
  });
  after(async function () {
    console.log('in after', threeboxServer.database);
    await threeboxServer.stop();
  });
  it('Set up data to be restored by 3box', async function () {
    await withFixtures(
      {
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement(By.css('#password'));
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);

        // turns on threebox syncing
        await driver.clickElement(By.css('.account-menu__icon'));
        await driver.clickElement(
          By.xpath(`//div[contains(text(), 'Settings')]`),
        );

        // turns on threebox syncing
        await driver.clickElement(
          By.xpath(`//div[contains(text(), 'Advanced')]`),
        );
        await driver.clickElement(
          By.css('[data-testid="advanced-setting-3box"] .toggle-button div'),
        );

        // updates settings and address book
        await driver.clickElement(
          By.xpath(`//div[contains(text(), 'General')]`),
        );

        // turns on use of blockies
        await driver.clickElement(By.css('.toggle-button > div'));

        // adds an address to the contact list
        await driver.clickElement(
          By.xpath(`//div[contains(text(), 'Contacts')]`),
        );

        await driver.clickElement(By.css('.address-book-add-button__button'));
        const addAddressInputs = await driver.findElements(By.css('input'));
        await addAddressInputs[0].sendKeys('Test User Name 11');
        await addAddressInputs[1].sendKeys(
          '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        );
        await driver.delay(largeDelayMs * 2);

        await driver.clickElement(
          By.xpath(`//button[contains(text(), 'Save')]`),
        );

        await driver.findElement(
          By.xpath(`//div[contains(text(), 'Test User Name 11')]`),
        );
        await driver.delay(largeDelayMs);
      },
    );
  });
});
