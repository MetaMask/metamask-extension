const { strict: assert } = require('assert');
const { By, Key, until } = require('selenium-webdriver');
const { withFixtures } = require('../helpers');

describe('Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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
        fixtures: 'connected-state',
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver }) => {
        await driver.navigate();
        const passwordField = await driver.findElement(By.css('#password'));
        await passwordField.sendKeys('correct horse battery staple');
        await passwordField.sendKeys(Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');

        // creates a sign typed data signature request
        await driver.clickElement(By.id('signTypedDataV4'), 10000);

        await driver.waitUntilXWindowHandles(3);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const title = await driver.findElement(
          By.css('.signature-request-content__title'),
        );
        const name = await driver.findElement(
          By.css('.signature-request-content__info--bolded'),
        );
        const content = await driver.findElements(
          By.css('.signature-request-content__info'),
        );
        const origin = content[0];
        const address = content[1];
        assert.equal(await title.getText(), 'Signature Request');
        assert.equal(await name.getText(), 'Ether Mail');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');
        assert.equal(
          await address.getText(),
          `${publicAddress.slice(0, 8)}...${publicAddress.slice(
            publicAddress.length - 8,
          )}`,
        );

        // signs the transaction
        await driver.clickElement(
          By.xpath(`//button[contains(text(), 'Sign')]`),
          10000,
        );

        const extension = windowHandles[0];
        await driver.switchToWindow(extension);

        // gets the current accounts address
        await driver.clickElement(
          By.css('[data-testid="account-options-menu-button"]'),
        );
        await driver.clickElement(
          By.css('[data-testid="account-options-menu__account-details"]'),
        );

        const addressInput = await driver.findElement(
          By.css('.readonly-input__input'),
        );
        const newPublicAddress = await addressInput.getAttribute('value');
        const accountModal = await driver.findElement(By.css('span .modal'));

        await driver.clickElement(By.css('.account-modal__close'));

        await driver.wait(until.stalenessOf(accountModal));
        assert.equal(newPublicAddress.toLowerCase(), publicAddress);
      },
    );
  });
});
