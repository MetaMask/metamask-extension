const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
} = require('../helpers');

describe('Sign Typed Data V4 Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
    const ganacheOptions = {
      accounts: [
        {
<<<<<<< HEAD
          secretKey:
            '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
          balance: convertToHexValue(25000000000000000000),
=======
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
>>>>>>> upstream/multichain-swaps-controller
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
          '.signature-request-content__title',
        );
        const name = await driver.findElement(
          '.signature-request-content__info--bolded',
        );
        const content = await driver.findElements(
          '.signature-request-content__info',
        );
        const origin = content[0];
        const address = content[1];
        const message = await driver.findElement(
          '.signature-request-message__node__value',
        );
        assert.equal(await title.getText(), 'Signature request');
        assert.equal(await name.getText(), 'Ether Mail');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');
        assert.equal(
          await address.getText(),
          `${publicAddress.slice(0, 8)}...${publicAddress.slice(
            publicAddress.length - 8,
          )}`,
        );
        assert.equal(await message.getText(), 'Hello, Bob!');
        // Approve signing typed data
        await driver.clickElement(
          '[data-testid="signature-request-scroll-button"]',
        );
        await driver.delay(regularDelayMs);
        await driver.clickElement({ text: 'Sign', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        windowHandles = await driver.getAllWindowHandles();

<<<<<<< HEAD
        // switch to the Dapp and verify the signed addressed
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        await driver.clickElement('#signTypedDataV4Verify');
        const recoveredAddress = await driver.findElement(
          '#signTypedDataV4VerifyResult',
        );
        assert.equal(await recoveredAddress.getText(), publicAddress);
      },
    );
=======
          // Approve signing typed data
          await approveSignatureRequest(
            driver,
            data.type,
            '[data-testid="signature-request-scroll-button"]',
          );
          await driver.waitUntilXWindowHandles(2);
          windowHandles = await driver.getAllWindowHandles();

          // switch to the Dapp and verify the signed address
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
          await driver.clickElement(data.verifyId);
          const recoveredAddress = await driver.findElement(
            data.verifyResultId,
          );

          assert.equal(await recoveredAddress.getText(), publicAddress);
        },
      );
    });
  });

  testData.forEach((data) => {
    it(`can queue multiple Signature Requests of ${data.type} and confirm @no-mmi`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          const addresses = await ganacheServer.getAccounts();
          const publicAddress = addresses[0];
          await driver.navigate();
          await driver.fill('#password', 'correct horse battery staple');
          await driver.press('#password', driver.Key.ENTER);

          await openDapp(driver);

          // creates multiple sign typed data signature requests
          await driver.clickElement(data.buttonId);

          await driver.waitUntilXWindowHandles(3);
          const windowHandles = await driver.getAllWindowHandles();
          // switches to Dapp
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
          // creates second sign typed data signature request
          await driver.clickElement(data.buttonId);

          await driver.switchToWindowWithTitle(
            'MetaMask Notification',
            windowHandles,
          );

          await driver.waitForSelector({
            text: 'Reject 2 requests',
            tag: 'button',
          });

          await verifyAndAssertSignTypedData(
            driver,
            data.type,
            data.verifyAndAssertMessage.titleClass,
            data.verifyAndAssertMessage.originClass,
            data.verifyAndAssertMessage.messageClass,
            data.expectedMessage,
          );

          // approve first signature request
          await approveSignatureRequest(
            driver,
            data.type,
            '[data-testid="signature-request-scroll-button"]',
          );
          await driver.waitUntilXWindowHandles(3);

          // approve second signature request
          await approveSignatureRequest(
            driver,
            data.type,
            '[data-testid="signature-request-scroll-button"]',
          );
          await driver.waitUntilXWindowHandles(2);

          // switch to the Dapp and verify the signed address for each request
          await driver.switchToWindowWithTitle('E2E Test Dapp');
          await driver.clickElement(data.verifyId);
          const recoveredAddress = await driver.findElement(
            data.verifyResultId,
          );
          assert.equal(await recoveredAddress.getText(), publicAddress);
        },
      );
    });
>>>>>>> upstream/multichain-swaps-controller
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
          '.signature-request-content__title',
        );
        const name = await driver.findElement(
          '.signature-request-content__info--bolded',
        );
        const content = await driver.findElements(
          '.signature-request-content__info',
        );
        const origin = content[0];
        const address = content[1];
        const messages = await driver.findElements(
          '.signature-request-message__node__value',
        );
        assert.equal(await title.getText(), 'Signature request');
        assert.equal(await name.getText(), 'Ether Mail');
        assert.equal(await origin.getText(), 'http://127.0.0.1:8080');
        assert.equal(
          await address.getText(),
          `${publicAddress.slice(0, 8)}...${publicAddress.slice(
            publicAddress.length - 8,
          )}`,
        );
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
          '.request-signature__header__text',
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
