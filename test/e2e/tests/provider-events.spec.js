const { strict: assert } = require('assert');
const { By, Key, until } = require('selenium-webdriver');
const { withFixtures, regularDelayMs, largeDelayMs } = require('../helpers');

describe('MetaMask', function () {
  it('provider listening for events', async function () {
    const ganacheOptions = {
      accounts: [
        {
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: 25000000000000000000,
        },
      ],
    };
    await withFixtures(
      {
        dapp: true,
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement(By.css('#password'));
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);
        await driver.clickElement(
          By.css('[data-testid="account-options-menu-button"]'),
        );
        await driver.clickElement(
          By.css('[data-testid="account-options-menu__account-details"]'),
        );
        const addressInput = await driver.findElement(
          By.css('.readonly-input__input'),
        );
        const publicAddress = await addressInput.getAttribute('value');

        const accountModal = await driver.findElement(By.css('span .modal'));
        await driver.clickElement(By.css('.account-modal__close'));

        await driver.wait(until.stalenessOf(accountModal));
        await driver.delay(regularDelayMs);

        await driver.openNewPage('http://127.0.0.1:8080/');

        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        const dapp = await driver.switchToWindowWithTitle(
          'E2E Test Dapp',
          windowHandles,
        );

        const networkDiv = await driver.findElement(By.css('#network'));
        await driver.delay(regularDelayMs);
        assert.equal(await networkDiv.getText(), '1337');

        await driver.switchToWindow(extension);

        await driver.clickElement(By.css('.network-display'));
        await driver.delay(regularDelayMs);

        await driver.clickElement(
          By.xpath(`//span[contains(text(), 'Ropsten')]`),
        );
        await driver.delay(largeDelayMs);

        await driver.switchToWindow(dapp);
        const switchedNetworkDiv = await driver.findElement(By.css('#network'));
        const chainIdDiv = await driver.findElement(By.css('#chainId'));
        const accountsDiv = await driver.findElement(By.css('#accounts'));

        assert.equal(await switchedNetworkDiv.getText(), '3');
        assert.equal(await chainIdDiv.getText(), '0x3');
        assert.equal(await accountsDiv.getText(), publicAddress.toLowerCase());
      },
    );
  });
});
