const { strict: assert } = require('assert');
const { By } = require('selenium-webdriver');
const {
  withFixtures,
  regularDelayMs,
  openDapp,
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
    verifyRejectionResultId: '#signTypedDataResult',
    rejectSignatureMessage: 'Error: User rejected the request.',
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
    verifyRejectionResultId: '#signTypedDataV3Result',
    rejectSignatureMessage: 'Error: User rejected the request.',
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
    verifyRejectionResultId: '#signTypedDataV4Result',
    rejectSignatureMessage: 'Error: User rejected the request.',
  },
];

describe('Sign Typed Data Signature Request', function () {
  testData.forEach((data) => {
    it(`can queue multiple Signature Requests of ${data.type} and confirm`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test.fullTitle(),
        },
        async ({ driver, localNodes }) => {
          const addresses = await localNodes[0].getAccounts();
          const publicAddress = addresses[0].toLowerCase();
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

          await driver.waitForSelector(
            By.xpath("//div[normalize-space(.)='1 of 2']"),
          );

          await driver.waitForSelector({
            text: 'Reject all',
            tag: 'button',
          });

          await verifyAndAssertRedesignedSignTypedData(
            driver,
            data.expectedMessage,
          );

          // Approve signing typed data
          await finalizeSignatureRequest(
            driver,
            '.confirm-scroll-to-bottom__button',
            'Confirm',
          );
          await driver.waitUntilXWindowHandles(3);

          // Approve signing typed data
          await finalizeSignatureRequest(
            driver,
            '.confirm-scroll-to-bottom__button',
            'Confirm',
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

  testData.forEach((data) => {
    it(`can initiate and reject a Signature Request of ${data.type}`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
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

          // Reject signing typed data
          await finalizeSignatureRequest(
            driver,
            '.confirm-scroll-to-bottom__button',
            'Cancel',
          );
          await driver.waitUntilXWindowHandles(2);
          windowHandles = await driver.getAllWindowHandles();

          // switch to the Dapp and verify the rejection was successful
          await driver.switchToWindowWithTitle('E2E Test Dapp', windowHandles);

          await driver.waitForSelector(data.verifyRejectionResultId);
          const rejectionResult = await driver.findElement(
            data.verifyRejectionResultId,
          );

          assert.equal(
            await rejectionResult.getText(),
            data.rejectSignatureMessage,
          );
        },
      );
    });
  });

  testData.forEach((data) => {
    it(`can queue multiple Signature Requests of ${data.type} and reject`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test.fullTitle(),
        },
        async ({ driver }) => {
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

          await driver.waitForSelector(
            By.xpath("//div[normalize-space(.)='1 of 2']"),
          );

          await driver.waitForSelector({
            text: 'Reject all',
            tag: 'button',
          });

          // reject first signature request
          await finalizeSignatureRequest(
            driver,
            '.confirm-scroll-to-bottom__button',
            'Cancel',
          );
          await driver.waitUntilXWindowHandles(3);

          // reject second signature request
          await finalizeSignatureRequest(
            driver,
            '.confirm-scroll-to-bottom__button',
            'Cancel',
          );
          await driver.waitUntilXWindowHandles(2);

          // switch to the Dapp and verify the rejection was successful
          await driver.switchToWindowWithTitle('E2E Test Dapp');

          await driver.waitForSelector(data.verifyRejectionResultId);
          const rejectionResult = await driver.findElement(
            data.verifyRejectionResultId,
          );
          assert.equal(
            await rejectionResult.getText(),
            data.rejectSignatureMessage,
          );
        },
      );
    });
  });
});
async function verifyAndAssertRedesignedSignTypedData(driver, expectedMessage) {
  await driver.findElement({
    css: 'h2',
    text: 'Signature request',
  });

  await driver.findElement({
    css: 'p',
    text: '127.0.0.1:8080',
  });

  await driver.findElement({
    css: 'p',
    text: expectedMessage,
  });
}

async function finalizeSignatureRequest(driver, buttonElementId, action) {
  await driver.delay(regularDelayMs);
  await driver.clickElementSafe(buttonElementId);

  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: action, tag: 'button' });
}
