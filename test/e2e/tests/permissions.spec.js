const { strict: assert } = require('assert');
const { By, Key } = require('selenium-webdriver');
const { withFixtures } = require('../helpers');

describe('Permissions', function () {
  it('sets permissions and connect to Dapp', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    const publicAddress = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
    await withFixtures(
      {
        dapp: true,
        fixtures: 'imported-account',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement(By.css('#password'));
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');
        await driver.clickElement(
          By.xpath(`//button[contains(text(), 'Connect')]`),
        );

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.clickElement(
          By.xpath(`//button[contains(text(), 'Next')]`),
        );
        await driver.clickElement(
          By.xpath(`//button[contains(text(), 'Connect')]`),
        );

        await driver.switchToWindow(extension);

        // shows connected sites
        await driver.clickElement(
          By.css('[data-testid="account-options-menu-button"]'),
        );
        await driver.clickElement(
          By.css('[data-testid="account-options-menu__connected-sites"]'),
        );

        await driver.findElement(
          By.xpath(`//h2[contains(text(), 'Connected sites')]`),
        );

        const domains = await driver.findClickableElements(
          By.css('.connected-sites-list__domain-name'),
        );
        assert.equal(domains.length, 1);

        // can get accounts within the dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        await driver.clickElement(
          By.xpath(`//button[contains(text(), 'eth_accounts')]`),
        );

        const getAccountsResult = await driver.findElement(
          By.css('#getAccountsResult'),
        );
        assert.equal(
          (await getAccountsResult.getText()).toLowerCase(),
          publicAddress.toLowerCase(),
        );
      },
    );
  });
});
