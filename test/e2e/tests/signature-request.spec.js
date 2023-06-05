const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  regularDelayMs,
  openDapp,
  DAPP_URL,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const ganacheOptions = {
  accounts: [
    {
      secretKey:
        '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
      balance: convertToHexValue(25000000000000000000),
    },
  ],
};

async function verifyAndAssertSignTypedDataV4(driver) {
  const title = await driver.findElement('.signature-request__content__title');
  const origin = await driver.findElement('.signature-request__origin');
  const verifyContractDetailsButton = await driver.findElement(
    '.signature-request-content__verify-contract-details',
  );
  const message = await driver.findElement(
    '.signature-request-data__node__value',
  );

  assert.equal(await title.getText(), 'Signature request');
  assert.equal(await origin.getText(), DAPP_URL);

  verifyContractDetailsButton.click();
  await driver.findElement({ text: 'Third-party details', tag: 'h5' });
  await driver.findElement('[data-testid="recipient"]');
  await driver.clickElement({ text: 'Got it', tag: 'button' });

  assert.equal(await message.getText(), 'Hello, Bob!');
}

async function approveSignatureRequest(driver, buttonElementId) {
  await driver.clickElement(buttonElementId);
  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: 'Sign', tag: 'button' });
}

describe('Sign Typed Data V4 Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV4');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await verifyAndAssertSignTypedDataV4(driver);

        // Approve signing typed data
        await approveSignatureRequest(
          driver,
          '[data-testid="signature-request-scroll-button"]',
        );
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

  it('can queue multiple Signature Request and confirm', async function () {
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

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV4');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();

        // switches to Dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        // creates a second sign typed data signature request
        await driver.clickElement('#signTypedDataV4');

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.waitForSelector({
          text: 'Reject 2 requests',
          tag: 'a',
        });

        await verifyAndAssertSignTypedDataV4(driver);

        // approve first signing typed data
        await approveSignatureRequest(
          driver,
          '[data-testid="signature-request-scroll-button"]',
        );

        // approve second signing typed data
        await approveSignatureRequest(
          driver,
          '[data-testid="signature-request-scroll-button"]',
        );

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

async function verifyAndAssertSignTypedDataV3(driver) {
  const title = await driver.findElement('.signature-request__content__title');
  const origin = await driver.findElement('.signature-request__origin');
  const verifyContractDetailsButton = await driver.findElement(
    '.signature-request-content__verify-contract-details',
  );

  const messages = await driver.findElements(
    '.signature-request-data__node__value',
  );

  assert.equal(await title.getText(), 'Signature request');
  assert.equal(await origin.getText(), DAPP_URL);

  verifyContractDetailsButton.click();
  await driver.findElement({ text: 'Third-party details', tag: 'h5' });
  await driver.findElement('[data-testid="recipient"]');
  await driver.clickElement({ text: 'Got it', tag: 'button' });

  assert.equal(await messages[4].getText(), 'Hello, Bob!');
}

/* eslint-disable-next-line mocha/max-top-level-suites */
describe('Sign Typed Data V3 Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV3');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await verifyAndAssertSignTypedDataV3(driver);

        // Approve signing typed data
        await approveSignatureRequest(
          driver,
          '[data-testid="signature-request-scroll-button"]',
        );
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

  it('can queue multiple Signature Requests and confirm', async function () {
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

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedDataV3');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        // switches to Dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);
        // creates second sign typed data signature request
        await driver.clickElement('#signTypedDataV3');

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.waitForSelector({
          text: 'Reject 2 requests',
          tag: 'a',
        });

        await verifyAndAssertSignTypedDataV3(driver);

        // approve first signing typed data
        await approveSignatureRequest(
          driver,
          '[data-testid="signature-request-scroll-button"]',
        );

        // approve second signing typed data
        await approveSignatureRequest(
          driver,
          '[data-testid="signature-request-scroll-button"]',
        );

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
async function verifyAndAssertSignTypedData(driver) {
  const title = await driver.findElement('.request-signature__content__title');
  const origin = await driver.findElement('.request-signature__origin');
  const message = await driver.findElements('.request-signature__row-value');
  assert.equal(await title.getText(), 'Signature request');
  assert.equal(await origin.getText(), DAPP_URL);
  assert.equal(await message[0].getText(), 'Hi, Alice!');
  assert.equal(await message[1].getText(), '1337');
}
describe('Sign Typed Data Signature Request', function () {
  it('can initiate and confirm a Signature Request', async function () {
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

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedData');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await verifyAndAssertSignTypedData(driver);

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

  it('can queue multiple Signature Request and confirm', async function () {
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

        await openDapp(driver);

        // creates a sign typed data signature request
        await driver.clickElement('#signTypedData');

        await driver.waitUntilXWindowHandles(3);
        let windowHandles = await driver.getAllWindowHandles();

        // switches to Dapp
        await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

        // creates second sign typed data signature request
        await driver.clickElement('#signTypedData');

        await driver.switchToWindowWithTitle(
          'MetaMask Notification',
          windowHandles,
        );

        await driver.waitForSelector({ text: 'Reject 2 requests', tag: 'a' });

        await verifyAndAssertSignTypedData(driver);

        // approve first signing typed data
        await driver.clickElement({ text: 'Sign', tag: 'button' });

        // approve second signing typed data
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
