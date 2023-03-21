const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Sign Typed Data V4 Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV4');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const title = await driver.findElement(
          '.signature-request__content__title',
        );
        const origin = await driver.findElement('.signature-request__origin');
        const verifyContractDetailsButton = await driver.findElement(
          '.signature-request-content__verify-contract-details',
        );
        const message = await driver.findElement(
          '.signature-request-data__node__value',
        );

        assert.equal(await title.getText(), 'Signature request');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');

        verifyContractDetailsButton.click();
        await driver.findElement({ text: 'Third-party details', tag: 'h5' });
        await driver.findElement('[data-testid="recipient"]');
        await driver.clickElement({ text: 'Got it', tag: 'button' });

        assert.equal(await message.getText(), 'Hello, Bob!');
        // Approve signing typed data
        await driver.clickElement(
          '[data-testid="signature-request-scroll-button"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        // switch to the Dapp and verify the signed addressed
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement('#signTypedDataV4Verify');
        const recoveredAddress = await driver.findElement(
          '#signTypedDataV4VerifyResult',
        );
        assert.equal(await recoveredAddress.getText(), publicAddress);
      },
    );
  });
});

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Sign Typed Data V3 Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV3');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const title = await driver.findElement(
          '.signature-request__content__title',
        );
        const origin = await driver.findElement('.signature-request__origin');
        const verifyContractDetailsButton = await driver.findElement(
          '.signature-request-content__verify-contract-details',
        );

        const messages = await driver.findElements(
          '.signature-request-data__node__value',
        );

        assert.equal(await title.getText(), 'Signature request');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');

        verifyContractDetailsButton.click();
        await driver.findElement({ text: 'Third-party details', tag: 'h5' });
        await driver.findElement('[data-testid="recipient"]');
        await driver.clickElement({ text: 'Got it', tag: 'button' });

        assert.equal(await messages[4].getText(), 'Hello, Bob!');

        // Approve signing typed data
        await driver.clickElement(
          '[data-testid="signature-request-scroll-button"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        // switch to the Dapp and verify the signed addressed
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement('#signTypedDataV3Verify');
        const recoveredAddress = await driver.findElement(
          '#signTypedDataV3VerifyResult',
        );
        assert.equal(await recoveredAddress.getText(), publicAddress);
      },
    );
  });
});

describe('Sign Typed Data Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions,
        title: this.test.title,
      },
      async ({ driver, ganacheServer }) => {
        const addresses = await ganacheServer.getAccounts();
        const publicAddress = addresses[0];
        await driver.navigate();
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        await driver.openNewPage('http://127.0.0.1:8080/');

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedData');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        const title = await driver.findElement(
          '.request-signature__content__title',
        );
        const origin = await driver.findElement('.request-signature__origin');
        const message = await driver.findElements(
          '.request-signature__row-value',
        );
        assert.equal(await title.getText(), 'Signature request');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');
        assert.equal(await message[0].getText(), 'Hi, Alice!');
        assert.equal(await message[1].getText(), '1337');

        // Approve signing typed data
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

        // switch to the Dapp and verify the signed addressed
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement('#signTypedDataVerify');
        const recoveredAddress = await driver.findElement(
          '#signTypedDataVerifyResult',
        );
        assert.equal(await recoveredAddress.getText(), publicAddress);
      },
    );
  });
});
