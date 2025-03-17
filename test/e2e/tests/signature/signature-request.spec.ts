import { strict as assert } from 'assert';
import { By, WebDriver } from 'selenium-webdriver';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import {
  withFixtures,
  regularDelayMs,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { TestSuiteArguments } from '../confirmations/transactions/shared';

const signatureRequestType = {
  signTypedData: 'Sign Typed Data',
  signTypedDataV3: 'Sign Typed Data V3',
  signTypedDataV4: 'Sign Typed Data V4',
} as const;

interface TestData {
  type: string;
  buttonId: string;
  verifyId: string;
  verifyResultId: string;
  expectedMessage: string;
  verifyAndAssertMessage: {
    titleClass: string;
    originClass: string;
    messageClass: string;
  };
  verifyRejectionResultId: string;
  rejectSignatureMessage: string;
}

const testData: TestData[] = [
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
          title: this.test?.fullTitle(),
        },
        async ({ driver, localNodes }) => {
          const confirmation = new Confirmation(driver);

          const addresses = await localNodes[0].getAccounts();
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

          await confirmation.check_pageNumbers(1, 2);
          await confirmation.waitForRejectAllButton();

          await verifyAndAssertRedesignedSignTypedData(
            driver,
            data.expectedMessage,
          );

          // Approve first signing typed data
          await confirmation.clickScrollToBottomButton();
          await confirmation.clickFooterConfirmButton();
          await driver.waitUntilXWindowHandles(3);

          // Approve signing typed data
          await confirmation.clickScrollToBottomButton();
          await confirmation.clickFooterConfirmButton();
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
            title: this.test?.fullTitle(),
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
          title: this.test?.fullTitle(),
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

async function verifyAndAssertRedesignedSignTypedData(
  driver: TestSuiteArguments['driver'],
  expectedMessage: string,
): Promise<void> {
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

async function finalizeSignatureRequest(
  driver: TestSuiteArguments['driver'],
  buttonElementId: string,
  action: string,
): Promise<void> {
  await driver.delay(regularDelayMs);
  await driver.clickElementSafe(buttonElementId);

  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: action, tag: 'button' });
}
