const { strict: assert } = require('assert');
const {
  withFixtures,
  regularDelayMs,
  openDapp,
  DAPP_URL,
  defaultGanacheOptions,
  unlockWallet,
  WINDOW_TITLES,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const signatureRequestType = {
  signTypedData: 'Sign Typed Data',
  signTypedDataV3: 'Sign Typed Data V3',
  signTypedDataV4: 'Sign Typed Data V4',
};

const testData = [
  {
    type: signatureRequestType.signTypedData,
    buttonId: '#signTypedData',
    verifyId: '#signTypedDataVerify',
    verifyResultId: '#signTypedDataVerifyResult',
    expectedMessage: 'Hi, Alice!',
    verifyAndAssertMessage: {
      titleClass: '.request-signature__content__title',
      originClass: '.request-signature__origin',
      messageClass: '.request-signature__row-value',
    },
  },
  {
    type: signatureRequestType.signTypedDataV3,
    buttonId: '#signTypedDataV3',
    verifyId: '#signTypedDataV3Verify',
    verifyResultId: '#signTypedDataV3VerifyResult',
    expectedMessage: 'Hello, Bob!',
    verifyAndAssertMessage: {
      titleClass: '.signature-request__content__title',
      originClass: '.signature-request__origin',
      messageClass: '.signature-request-data__node__value',
    },
  },
  {
    type: signatureRequestType.signTypedDataV4,
    buttonId: '#signTypedDataV4',
    verifyId: '#signTypedDataV4Verify',
    verifyResultId: '#signTypedDataV4VerifyResult',
    expectedMessage: 'Hello, Bob!',
    verifyAndAssertMessage: {
      titleClass: '.signature-request__content__title',
      originClass: '.signature-request__origin',
      messageClass: '.signature-request-data__node__value',
    },
  },
];

describe('Sign Typed Data Signature Request', function () {
  testData.forEach((data) => {
    it(`can initiate and confirm a Signature Request of ${data.type}`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          const addresses = await ganacheServer.getAccounts();
          const publicAddress = addresses[0];
          await unlockWallet(driver);

          await openDapp(driver);

          // creates a sign typed data signature request
          await driver.clickElement(data.buttonId);

          await driver.waitUntilXWindowHandles(3);
          let windowHandles = await driver.getAllWindowHandles();
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.Dialog,
            windowHandles,
          );

          await verifyAndAssertSignTypedData(
            driver,
            data.type,
            data.verifyAndAssertMessage.titleClass,
            data.verifyAndAssertMessage.originClass,
            data.verifyAndAssertMessage.messageClass,
            data.expectedMessage,
          );

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
    it(`can queue multiple Signature Requests of ${data.type} and confirm`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          ganacheOptions: defaultGanacheOptions,
          title: this.test.fullTitle(),
        },
        async ({ driver, ganacheServer }) => {
          const addresses = await ganacheServer.getAccounts();
          const publicAddress = addresses[0];
          await unlockWallet(driver);

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
            WINDOW_TITLES.Dialog,
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
  });
});

async function verifyAndAssertSignTypedData(
  driver,
  type,
  titleClass,
  originClass,
  messageClass,
  expectedMessage,
) {
  const title = await driver.findElement(titleClass);
  const origin = await driver.findElement(originClass);

  assert.equal(await title.getText(), 'Signature request');
  assert.equal(await origin.getText(), DAPP_URL);

  const messages = await driver.findElements(messageClass);
  if (type !== signatureRequestType.signTypedData) {
    const verifyContractDetailsButton = await driver.findElement(
      '.signature-request-content__verify-contract-details',
    );
    verifyContractDetailsButton.click();
    await driver.findElement({ text: 'Third-party details', tag: 'h5' });
    await driver.findElement('[data-testid="recipient"]');
    await driver.clickElement({ text: 'Got it', tag: 'button' });
  }
  const messageNumber = type === signatureRequestType.signTypedDataV3 ? 4 : 0;
  assert.equal(await messages[messageNumber].getText(), expectedMessage);
}

async function approveSignatureRequest(driver, type, buttonElementId) {
  if (type !== signatureRequestType.signTypedData) {
    await driver.delay(regularDelayMs);
    await driver.clickElement(buttonElementId);
  }
  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: 'Sign', tag: 'button' });
}
